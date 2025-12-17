use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo, Burn};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("BTRUSTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

/// Platform fee in basis points (0.5% = 50 bps)
const PLATFORM_FEE_BPS: u64 = 50;
/// Basis points denominator
const BPS_DENOMINATOR: u64 = 10000;
/// Minimum collateral ratio (150% = 15000 bps)
const MIN_COLLATERAL_RATIO_BPS: u64 = 15000;
/// Liquidation threshold (120% = 12000 bps)
const LIQUIDATION_THRESHOLD_BPS: u64 = 12000;
/// Liquidation penalty (10% = 1000 bps)
const LIQUIDATION_PENALTY_BPS: u64 = 1000;

#[program]
pub mod btrust_bond {
    use super::*;

    /// Initialize the B Trust platform
    pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()> {
        let platform = &mut ctx.accounts.platform;
        platform.authority = ctx.accounts.authority.key();
        platform.treasury = ctx.accounts.treasury.key();
        platform.total_bonds_issued = 0;
        platform.total_volume = 0;
        platform.fee_bps = PLATFORM_FEE_BPS;
        platform.bump = ctx.bumps.platform;
        
        emit!(PlatformInitialized {
            authority: platform.authority,
            treasury: platform.treasury,
        });
        
        Ok(())
    }

    /// Create a new bond offering
    pub fn create_bond(
        ctx: Context<CreateBond>,
        args: CreateBondArgs,
    ) -> Result<()> {
        require!(args.principal_amount > 0, BtrustError::InvalidPrincipal);
        require!(args.coupon_rate_bps <= 10000, BtrustError::InvalidCouponRate); // Max 100% APY
        require!(args.maturity_timestamp > Clock::get()?.unix_timestamp, BtrustError::InvalidMaturity);
        require!(args.total_supply > 0, BtrustError::InvalidSupply);
        
        let bond = &mut ctx.accounts.bond;
        let platform = &mut ctx.accounts.platform;
        
        bond.issuer = ctx.accounts.issuer.key();
        bond.bond_mint = ctx.accounts.bond_mint.key();
        bond.collateral_mint = ctx.accounts.collateral_mint.key();
        bond.collateral_vault = ctx.accounts.collateral_vault.key();
        bond.name = args.name;
        bond.symbol = args.symbol;
        bond.description = args.description;
        bond.image_uri = args.image_uri;
        bond.website = args.website;
        bond.twitter = args.twitter;
        bond.discord = args.discord;
        bond.principal_amount = args.principal_amount;
        bond.coupon_rate_bps = args.coupon_rate_bps;
        bond.is_variable_rate = args.is_variable_rate;
        bond.payment_frequency = args.payment_frequency;
        bond.maturity_timestamp = args.maturity_timestamp;
        bond.created_at = Clock::get()?.unix_timestamp;
        bond.total_supply = args.total_supply;
        bond.outstanding_supply = 0;
        bond.is_capped = args.is_capped;
        bond.collateral_ratio_bps = args.collateral_ratio_bps.max(MIN_COLLATERAL_RATIO_BPS);
        bond.collateral_deposited = 0;
        bond.total_yield_paid = 0;
        bond.last_yield_payment = Clock::get()?.unix_timestamp;
        bond.is_active = true;
        bond.is_matured = false;
        bond.bump = ctx.bumps.bond;
        
        platform.total_bonds_issued += 1;
        
        emit!(BondCreated {
            bond: bond.key(),
            issuer: bond.issuer,
            name: bond.name.clone(),
            principal_amount: bond.principal_amount,
            coupon_rate_bps: bond.coupon_rate_bps,
            maturity_timestamp: bond.maturity_timestamp,
            total_supply: bond.total_supply,
        });
        
        Ok(())
    }

    /// Deposit collateral for a bond
    pub fn deposit_collateral(
        ctx: Context<DepositCollateral>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, BtrustError::InvalidAmount);
        
        let bond = &mut ctx.accounts.bond;
        require!(bond.is_active, BtrustError::BondNotActive);
        require!(!bond.is_matured, BtrustError::BondMatured);
        
        // Transfer collateral to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.issuer_collateral.to_account_info(),
                    to: ctx.accounts.collateral_vault.to_account_info(),
                    authority: ctx.accounts.issuer.to_account_info(),
                },
            ),
            amount,
        )?;
        
        bond.collateral_deposited += amount;
        
        emit!(CollateralDeposited {
            bond: bond.key(),
            amount,
            total_collateral: bond.collateral_deposited,
        });
        
        Ok(())
    }

    /// Purchase bonds from an offering
    pub fn purchase_bond(
        ctx: Context<PurchaseBond>,
        quantity: u64,
    ) -> Result<()> {
        require!(quantity > 0, BtrustError::InvalidAmount);
        
        let bond = &mut ctx.accounts.bond;
        let platform = &ctx.accounts.platform;
        
        require!(bond.is_active, BtrustError::BondNotActive);
        require!(!bond.is_matured, BtrustError::BondMatured);
        
        if bond.is_capped {
            require!(
                bond.outstanding_supply + quantity <= bond.total_supply,
                BtrustError::ExceedsSupply
            );
        }
        
        // Calculate payment amount
        let payment_amount = bond.principal_amount
            .checked_mul(quantity)
            .ok_or(BtrustError::MathOverflow)?;
        
        // Calculate platform fee
        let fee_amount = payment_amount
            .checked_mul(platform.fee_bps)
            .ok_or(BtrustError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(BtrustError::MathOverflow)?;
        
        let issuer_amount = payment_amount
            .checked_sub(fee_amount)
            .ok_or(BtrustError::MathOverflow)?;
        
        // Transfer payment to issuer (minus fee)
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_payment.to_account_info(),
                    to: ctx.accounts.issuer_payment.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            ),
            issuer_amount,
        )?;
        
        // Transfer fee to treasury
        if fee_amount > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.buyer_payment.to_account_info(),
                        to: ctx.accounts.treasury.to_account_info(),
                        authority: ctx.accounts.buyer.to_account_info(),
                    },
                ),
                fee_amount,
            )?;
        }
        
        // Mint bond tokens to buyer
        let bond_key = bond.key();
        let seeds = &[
            b"bond",
            bond_key.as_ref(),
            &[bond.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.bond_mint.to_account_info(),
                    to: ctx.accounts.buyer_bond_account.to_account_info(),
                    authority: bond.to_account_info(),
                },
                signer_seeds,
            ),
            quantity,
        )?;
        
        bond.outstanding_supply += quantity;
        
        // Create or update holder position
        let position = &mut ctx.accounts.holder_position;
        if position.holder == Pubkey::default() {
            position.holder = ctx.accounts.buyer.key();
            position.bond = bond.key();
            position.quantity = quantity;
            position.purchase_price = bond.principal_amount;
            position.purchase_timestamp = Clock::get()?.unix_timestamp;
            position.total_yield_claimed = 0;
            position.bump = ctx.bumps.holder_position;
        } else {
            // Average purchase price
            let total_value = position.quantity
                .checked_mul(position.purchase_price)
                .ok_or(BtrustError::MathOverflow)?
                .checked_add(payment_amount)
                .ok_or(BtrustError::MathOverflow)?;
            position.quantity += quantity;
            position.purchase_price = total_value
                .checked_div(position.quantity)
                .ok_or(BtrustError::MathOverflow)?;
        }
        
        emit!(BondPurchased {
            bond: bond.key(),
            buyer: ctx.accounts.buyer.key(),
            quantity,
            payment_amount,
            fee_amount,
        });
        
        Ok(())
    }

    /// Deposit yield payment for bond holders
    pub fn deposit_yield(
        ctx: Context<DepositYield>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, BtrustError::InvalidAmount);
        
        let bond = &mut ctx.accounts.bond;
        require!(bond.is_active, BtrustError::BondNotActive);
        require!(bond.issuer == ctx.accounts.issuer.key(), BtrustError::Unauthorized);
        
        // Transfer yield to yield vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.issuer_payment.to_account_info(),
                    to: ctx.accounts.yield_vault.to_account_info(),
                    authority: ctx.accounts.issuer.to_account_info(),
                },
            ),
            amount,
        )?;
        
        bond.last_yield_payment = Clock::get()?.unix_timestamp;
        
        emit!(YieldDeposited {
            bond: bond.key(),
            amount,
            timestamp: bond.last_yield_payment,
        });
        
        Ok(())
    }

    /// Claim accrued yield
    pub fn claim_yield(ctx: Context<ClaimYield>) -> Result<()> {
        let bond = &ctx.accounts.bond;
        let position = &mut ctx.accounts.holder_position;
        
        require!(position.holder == ctx.accounts.holder.key(), BtrustError::Unauthorized);
        
        // Calculate yield owed
        let time_held = Clock::get()?.unix_timestamp
            .checked_sub(position.purchase_timestamp)
            .ok_or(BtrustError::MathOverflow)?;
        
        let annual_yield = position.quantity
            .checked_mul(position.purchase_price)
            .ok_or(BtrustError::MathOverflow)?
            .checked_mul(bond.coupon_rate_bps)
            .ok_or(BtrustError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(BtrustError::MathOverflow)?;
        
        let yield_owed = annual_yield
            .checked_mul(time_held as u64)
            .ok_or(BtrustError::MathOverflow)?
            .checked_div(31536000) // seconds in a year
            .ok_or(BtrustError::MathOverflow)?
            .checked_sub(position.total_yield_claimed)
            .ok_or(BtrustError::MathOverflow)?;
        
        require!(yield_owed > 0, BtrustError::NoYieldToClaim);
        
        // Check yield vault balance
        let vault_balance = ctx.accounts.yield_vault.amount;
        let claimable = yield_owed.min(vault_balance);
        
        require!(claimable > 0, BtrustError::InsufficientYieldBalance);
        
        // Transfer yield to holder
        let bond_key = bond.key();
        let seeds = &[
            b"bond",
            bond_key.as_ref(),
            &[bond.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.yield_vault.to_account_info(),
                    to: ctx.accounts.holder_payment.to_account_info(),
                    authority: ctx.accounts.bond.to_account_info(),
                },
                signer_seeds,
            ),
            claimable,
        )?;
        
        position.total_yield_claimed += claimable;
        
        emit!(YieldClaimed {
            bond: bond.key(),
            holder: ctx.accounts.holder.key(),
            amount: claimable,
        });
        
        Ok(())
    }

    /// Redeem bonds at maturity
    pub fn redeem_bond(ctx: Context<RedeemBond>, quantity: u64) -> Result<()> {
        require!(quantity > 0, BtrustError::InvalidAmount);
        
        let bond = &mut ctx.accounts.bond;
        let position = &mut ctx.accounts.holder_position;
        
        require!(
            Clock::get()?.unix_timestamp >= bond.maturity_timestamp,
            BtrustError::BondNotMatured
        );
        require!(position.quantity >= quantity, BtrustError::InsufficientBalance);
        
        let redemption_amount = bond.principal_amount
            .checked_mul(quantity)
            .ok_or(BtrustError::MathOverflow)?;
        
        // Burn bond tokens
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.bond_mint.to_account_info(),
                    from: ctx.accounts.holder_bond_account.to_account_info(),
                    authority: ctx.accounts.holder.to_account_info(),
                },
            ),
            quantity,
        )?;
        
        // Transfer principal from redemption vault
        let bond_key = bond.key();
        let seeds = &[
            b"bond",
            bond_key.as_ref(),
            &[bond.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.redemption_vault.to_account_info(),
                    to: ctx.accounts.holder_payment.to_account_info(),
                    authority: bond.to_account_info(),
                },
                signer_seeds,
            ),
            redemption_amount,
        )?;
        
        bond.outstanding_supply -= quantity;
        position.quantity -= quantity;
        
        if bond.outstanding_supply == 0 {
            bond.is_matured = true;
            bond.is_active = false;
        }
        
        emit!(BondRedeemed {
            bond: bond.key(),
            holder: ctx.accounts.holder.key(),
            quantity,
            redemption_amount,
        });
        
        Ok(())
    }

    /// Liquidate undercollateralized bond
    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        let bond = &mut ctx.accounts.bond;
        
        require!(bond.is_active, BtrustError::BondNotActive);
        require!(bond.collateral_deposited > 0, BtrustError::NoCollateral);
        
        // Calculate required collateral
        let outstanding_value = bond.outstanding_supply
            .checked_mul(bond.principal_amount)
            .ok_or(BtrustError::MathOverflow)?;
        
        let required_collateral = outstanding_value
            .checked_mul(LIQUIDATION_THRESHOLD_BPS)
            .ok_or(BtrustError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(BtrustError::MathOverflow)?;
        
        // Note: In production, you'd use an oracle for collateral price
        // For now, assuming 1:1 value ratio
        require!(
            bond.collateral_deposited < required_collateral,
            BtrustError::NotLiquidatable
        );
        
        // Calculate liquidation bonus
        let bonus = bond.collateral_deposited
            .checked_mul(LIQUIDATION_PENALTY_BPS)
            .ok_or(BtrustError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(BtrustError::MathOverflow)?;
        
        let liquidator_reward = bond.collateral_deposited
            .checked_sub(bonus)
            .ok_or(BtrustError::MathOverflow)?;
        
        // Transfer collateral to liquidator
        let bond_key = bond.key();
        let seeds = &[
            b"bond",
            bond_key.as_ref(),
            &[bond.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.collateral_vault.to_account_info(),
                    to: ctx.accounts.liquidator_collateral.to_account_info(),
                    authority: bond.to_account_info(),
                },
                signer_seeds,
            ),
            liquidator_reward,
        )?;
        
        bond.collateral_deposited = 0;
        bond.is_active = false;
        
        emit!(BondLiquidated {
            bond: bond.key(),
            liquidator: ctx.accounts.liquidator.key(),
            collateral_seized: liquidator_reward,
        });
        
        Ok(())
    }

    /// Create a sell order for secondary market
    pub fn create_sell_order(
        ctx: Context<CreateSellOrder>,
        quantity: u64,
        price_per_bond: u64,
    ) -> Result<()> {
        require!(quantity > 0, BtrustError::InvalidAmount);
        require!(price_per_bond > 0, BtrustError::InvalidAmount);
        
        let order = &mut ctx.accounts.order;
        let bond = &ctx.accounts.bond;
        
        require!(bond.is_active, BtrustError::BondNotActive);
        
        // Transfer bonds to escrow
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.seller_bond_account.to_account_info(),
                    to: ctx.accounts.order_escrow.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            quantity,
        )?;
        
        order.seller = ctx.accounts.seller.key();
        order.bond = bond.key();
        order.quantity = quantity;
        order.price_per_bond = price_per_bond;
        order.created_at = Clock::get()?.unix_timestamp;
        order.is_active = true;
        order.bump = ctx.bumps.order;
        
        emit!(SellOrderCreated {
            order: order.key(),
            bond: bond.key(),
            seller: order.seller,
            quantity,
            price_per_bond,
        });
        
        Ok(())
    }

    /// Fill a sell order (buy from secondary market)
    pub fn fill_order(ctx: Context<FillOrder>, quantity: u64) -> Result<()> {
        require!(quantity > 0, BtrustError::InvalidAmount);
        
        let order = &mut ctx.accounts.order;
        let platform = &ctx.accounts.platform;
        
        require!(order.is_active, BtrustError::OrderNotActive);
        require!(quantity <= order.quantity, BtrustError::ExceedsOrderQuantity);
        
        let payment_amount = order.price_per_bond
            .checked_mul(quantity)
            .ok_or(BtrustError::MathOverflow)?;
        
        // Calculate fee
        let fee_amount = payment_amount
            .checked_mul(platform.fee_bps)
            .ok_or(BtrustError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(BtrustError::MathOverflow)?;
        
        let seller_amount = payment_amount
            .checked_sub(fee_amount)
            .ok_or(BtrustError::MathOverflow)?;
        
        // Transfer payment to seller
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_payment.to_account_info(),
                    to: ctx.accounts.seller_payment.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            ),
            seller_amount,
        )?;
        
        // Transfer fee
        if fee_amount > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.buyer_payment.to_account_info(),
                        to: ctx.accounts.treasury.to_account_info(),
                        authority: ctx.accounts.buyer.to_account_info(),
                    },
                ),
                fee_amount,
            )?;
        }
        
        // Transfer bonds from escrow to buyer
        let order_key = order.key();
        let seeds = &[
            b"order",
            order_key.as_ref(),
            &[order.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.order_escrow.to_account_info(),
                    to: ctx.accounts.buyer_bond_account.to_account_info(),
                    authority: order.to_account_info(),
                },
                signer_seeds,
            ),
            quantity,
        )?;
        
        order.quantity -= quantity;
        if order.quantity == 0 {
            order.is_active = false;
        }
        
        emit!(OrderFilled {
            order: order.key(),
            buyer: ctx.accounts.buyer.key(),
            quantity,
            payment_amount,
        });
        
        Ok(())
    }

    /// Cancel a sell order
    pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
        let order = &mut ctx.accounts.order;
        
        require!(order.is_active, BtrustError::OrderNotActive);
        require!(order.seller == ctx.accounts.seller.key(), BtrustError::Unauthorized);
        
        // Return bonds from escrow
        let order_key = order.key();
        let seeds = &[
            b"order",
            order_key.as_ref(),
            &[order.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.order_escrow.to_account_info(),
                    to: ctx.accounts.seller_bond_account.to_account_info(),
                    authority: order.to_account_info(),
                },
                signer_seeds,
            ),
            order.quantity,
        )?;
        
        order.is_active = false;
        
        emit!(OrderCancelled {
            order: order.key(),
        });
        
        Ok(())
    }
}

// ============================================================================
// Accounts
// ============================================================================

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + Platform::INIT_SPACE,
        seeds = [b"platform"],
        bump,
    )]
    pub platform: Account<'info, Platform>,
    
    /// CHECK: Treasury account for fees
    pub treasury: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: CreateBondArgs)]
pub struct CreateBond<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,
    
    #[account(
        init,
        payer = issuer,
        space = 8 + Bond::INIT_SPACE,
        seeds = [b"bond", bond_mint.key().as_ref()],
        bump,
    )]
    pub bond: Account<'info, Bond>,
    
    #[account(
        init,
        payer = issuer,
        mint::decimals = 0,
        mint::authority = bond,
    )]
    pub bond_mint: Account<'info, Mint>,
    
    pub collateral_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = issuer,
        token::mint = collateral_mint,
        token::authority = bond,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,
    
    #[account(
        mut,
        constraint = bond.issuer == issuer.key() @ BtrustError::Unauthorized,
    )]
    pub bond: Account<'info, Bond>,
    
    #[account(
        mut,
        constraint = issuer_collateral.mint == bond.collateral_mint,
    )]
    pub issuer_collateral: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = collateral_vault.key() == bond.collateral_vault,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PurchaseBond<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,
    
    #[account(mut)]
    pub bond: Account<'info, Bond>,
    
    #[account(
        mut,
        constraint = bond_mint.key() == bond.bond_mint,
    )]
    pub bond_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub buyer_payment: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub issuer_payment: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = treasury.key() == platform.treasury,
    )]
    pub treasury: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = bond_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_bond_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + HolderPosition::INIT_SPACE,
        seeds = [b"position", bond.key().as_ref(), buyer.key().as_ref()],
        bump,
    )]
    pub holder_position: Account<'info, HolderPosition>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositYield<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,
    
    #[account(
        mut,
        constraint = bond.issuer == issuer.key() @ BtrustError::Unauthorized,
    )]
    pub bond: Account<'info, Bond>,
    
    #[account(mut)]
    pub issuer_payment: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"yield_vault", bond.key().as_ref()],
        bump,
    )]
    pub yield_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimYield<'info> {
    #[account(mut)]
    pub holder: Signer<'info>,
    
    #[account(
        seeds = [b"bond", bond.bond_mint.as_ref()],
        bump = bond.bump,
    )]
    pub bond: Account<'info, Bond>,
    
    #[account(
        mut,
        seeds = [b"position", bond.key().as_ref(), holder.key().as_ref()],
        bump = holder_position.bump,
    )]
    pub holder_position: Account<'info, HolderPosition>,
    
    #[account(
        mut,
        seeds = [b"yield_vault", bond.key().as_ref()],
        bump,
    )]
    pub yield_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub holder_payment: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RedeemBond<'info> {
    #[account(mut)]
    pub holder: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"bond", bond.bond_mint.as_ref()],
        bump = bond.bump,
    )]
    pub bond: Account<'info, Bond>,
    
    #[account(
        mut,
        constraint = bond_mint.key() == bond.bond_mint,
    )]
    pub bond_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"position", bond.key().as_ref(), holder.key().as_ref()],
        bump = holder_position.bump,
    )]
    pub holder_position: Account<'info, HolderPosition>,
    
    #[account(mut)]
    pub holder_bond_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"redemption_vault", bond.key().as_ref()],
        bump,
    )]
    pub redemption_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub holder_payment: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(mut)]
    pub liquidator: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"bond", bond.bond_mint.as_ref()],
        bump = bond.bump,
    )]
    pub bond: Account<'info, Bond>,
    
    #[account(
        mut,
        constraint = collateral_vault.key() == bond.collateral_vault,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub liquidator_collateral: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateSellOrder<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    pub bond: Account<'info, Bond>,
    
    #[account(
        init,
        payer = seller,
        space = 8 + Order::INIT_SPACE,
        seeds = [b"order", seller.key().as_ref(), bond.key().as_ref(), &Clock::get().unwrap().unix_timestamp.to_le_bytes()],
        bump,
    )]
    pub order: Account<'info, Order>,
    
    #[account(mut)]
    pub seller_bond_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = seller,
        token::mint = bond.bond_mint,
        token::authority = order,
    )]
    pub order_escrow: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct FillOrder<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,
    
    #[account(mut)]
    pub order: Account<'info, Order>,
    
    #[account(mut)]
    pub buyer_payment: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub seller_payment: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = treasury.key() == platform.treasury,
    )]
    pub treasury: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub order_escrow: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer_bond_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(mut)]
    pub order: Account<'info, Order>,
    
    #[account(mut)]
    pub order_escrow: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub seller_bond_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

// ============================================================================
// State
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct Platform {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub total_bonds_issued: u64,
    pub total_volume: u64,
    pub fee_bps: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Bond {
    pub issuer: Pubkey,
    pub bond_mint: Pubkey,
    pub collateral_mint: Pubkey,
    pub collateral_vault: Pubkey,
    #[max_len(64)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    #[max_len(500)]
    pub description: String,
    #[max_len(200)]
    pub image_uri: String,
    #[max_len(100)]
    pub website: String,
    #[max_len(100)]
    pub twitter: String,
    #[max_len(100)]
    pub discord: String,
    pub principal_amount: u64,
    pub coupon_rate_bps: u64,
    pub is_variable_rate: bool,
    pub payment_frequency: u8, // 1=annual, 2=semi, 4=quarterly, 12=monthly
    pub maturity_timestamp: i64,
    pub created_at: i64,
    pub total_supply: u64,
    pub outstanding_supply: u64,
    pub is_capped: bool,
    pub collateral_ratio_bps: u64,
    pub collateral_deposited: u64,
    pub total_yield_paid: u64,
    pub last_yield_payment: i64,
    pub is_active: bool,
    pub is_matured: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct HolderPosition {
    pub holder: Pubkey,
    pub bond: Pubkey,
    pub quantity: u64,
    pub purchase_price: u64,
    pub purchase_timestamp: i64,
    pub total_yield_claimed: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Order {
    pub seller: Pubkey,
    pub bond: Pubkey,
    pub quantity: u64,
    pub price_per_bond: u64,
    pub created_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

// ============================================================================
// Args
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateBondArgs {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub image_uri: String,
    pub website: String,
    pub twitter: String,
    pub discord: String,
    pub principal_amount: u64,
    pub coupon_rate_bps: u64,
    pub is_variable_rate: bool,
    pub payment_frequency: u8,
    pub maturity_timestamp: i64,
    pub total_supply: u64,
    pub is_capped: bool,
    pub collateral_ratio_bps: u64,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct PlatformInitialized {
    pub authority: Pubkey,
    pub treasury: Pubkey,
}

#[event]
pub struct BondCreated {
    pub bond: Pubkey,
    pub issuer: Pubkey,
    pub name: String,
    pub principal_amount: u64,
    pub coupon_rate_bps: u64,
    pub maturity_timestamp: i64,
    pub total_supply: u64,
}

#[event]
pub struct CollateralDeposited {
    pub bond: Pubkey,
    pub amount: u64,
    pub total_collateral: u64,
}

#[event]
pub struct BondPurchased {
    pub bond: Pubkey,
    pub buyer: Pubkey,
    pub quantity: u64,
    pub payment_amount: u64,
    pub fee_amount: u64,
}

#[event]
pub struct YieldDeposited {
    pub bond: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct YieldClaimed {
    pub bond: Pubkey,
    pub holder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BondRedeemed {
    pub bond: Pubkey,
    pub holder: Pubkey,
    pub quantity: u64,
    pub redemption_amount: u64,
}

#[event]
pub struct BondLiquidated {
    pub bond: Pubkey,
    pub liquidator: Pubkey,
    pub collateral_seized: u64,
}

#[event]
pub struct SellOrderCreated {
    pub order: Pubkey,
    pub bond: Pubkey,
    pub seller: Pubkey,
    pub quantity: u64,
    pub price_per_bond: u64,
}

#[event]
pub struct OrderFilled {
    pub order: Pubkey,
    pub buyer: Pubkey,
    pub quantity: u64,
    pub payment_amount: u64,
}

#[event]
pub struct OrderCancelled {
    pub order: Pubkey,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum BtrustError {
    #[msg("Invalid principal amount")]
    InvalidPrincipal,
    #[msg("Invalid coupon rate")]
    InvalidCouponRate,
    #[msg("Invalid maturity date")]
    InvalidMaturity,
    #[msg("Invalid supply")]
    InvalidSupply,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Bond is not active")]
    BondNotActive,
    #[msg("Bond has matured")]
    BondMatured,
    #[msg("Bond has not matured yet")]
    BondNotMatured,
    #[msg("Exceeds available supply")]
    ExceedsSupply,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("No yield to claim")]
    NoYieldToClaim,
    #[msg("Insufficient yield balance in vault")]
    InsufficientYieldBalance,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("No collateral deposited")]
    NoCollateral,
    #[msg("Bond is not liquidatable")]
    NotLiquidatable,
    #[msg("Order is not active")]
    OrderNotActive,
    #[msg("Exceeds order quantity")]
    ExceedsOrderQuantity,
}

