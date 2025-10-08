use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("D3jAcqXfbzCFWK69m4ysWKEtTowuSFf3b33dAJo3k8DW");

#[program]
pub mod onchain_program {
    use super::*;

    pub fn initialize_vault(ctx : Context<InitializeVault>) -> Result<()>  {
        let vault = &mut ctx.accounts.vault;
        vault.owner = *ctx.accounts.user.key;
        vault.sol_vault = ctx.accounts.sol_vault.key();
        vault.usdc_vault = ctx.accounts.usdc_vault.key();
        vault.bump = ctx.bumps.vault;

        msg!("Trading Vault created for user {}", vault.owner);
        Ok(())
    }

    pub fn deposit(ctx: Context<UpdateVault>, amount_sol: u64, amount_usdc: u64) -> Result<()> {
        if amount_sol > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.user_sol_account.to_account_info(),
                to: ctx.accounts.sol_vault.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, amount_sol)?;
            
            ctx.accounts.sol_vault.reload()?;
            msg!("Deposited {} SOL. New balance: {}", amount_sol, ctx.accounts.sol_vault.amount);
        }

        if amount_usdc > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.user_usdc_account.to_account_info(),
                to: ctx.accounts.usdc_vault.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, amount_usdc)?;

            ctx.accounts.usdc_vault.reload()?;
            msg!("Deposited {} USDC. New balance: {}", amount_usdc, ctx.accounts.usdc_vault.amount);
        }
        
        Ok(())
    }

    pub fn withdraw(ctx: Context<UpdateVault>, amount_sol: u64, amount_usdc: u64) -> Result<()> {
        let seeds = &[
            b"vault".as_ref(),
            ctx.accounts.owner.to_account_info().key.as_ref(),
            &[ctx.accounts.vault.bump],
        ];
        let signer = &[&seeds[..]];

        if amount_sol > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.sol_vault.to_account_info(),
                to: ctx.accounts.user_sol_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, amount_sol)?;

            ctx.accounts.sol_vault.reload()?;
            msg!("Withdrew {} SOL. New balance: {}", amount_sol, ctx.accounts.sol_vault.amount);
        }

        if amount_usdc > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.usdc_vault.to_account_info(),
                to: ctx.accounts.user_usdc_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, amount_usdc)?;

            ctx.accounts.usdc_vault.reload()?;
            msg!("Withdrew {} USDC. New balance: {}", amount_usdc, ctx.accounts.usdc_vault.amount);
        }

        Ok(())
    }

    pub fn create_job(ctx : Context<CreateJob>, job_id : u64) -> Result<()> {
        let job = &mut ctx.accounts.job;
        job.authority = *ctx.accounts.authority.key;
        job.job_id = job_id;
        job.status = JobStatus::Pending;
        msg!("Job #{} created for authority {}", job_id, job.authority);
        Ok(())
    }

    pub fn execute_job(ctx: Context<ExecuteJob>, result: Vec<u8>) -> Result<()> {
        let job = &mut ctx.accounts.job;
        job.status = JobStatus::Completed;
        job.result = result;
        msg!("Job #{} executed successfully.", job.job_id);
        Ok(())
    }
}

#[account]
pub struct TradingVault {
    pub owner : Pubkey,
    pub sol_vault: Pubkey,
    pub usdc_vault: Pubkey,
    pub bump : u8,
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 1,
        seeds = [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TradingVault>,
    pub sol_mint: Account<'info, Mint>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = user,
        associated_token::mint = sol_mint,
        associated_token::authority = vault,
    )]
    pub sol_vault: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = user,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub usdc_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateVault<'info> {
    #[account(
        mut,
        has_one = owner,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, TradingVault>,
    #[account(mut)]
    pub user_sol_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,
    #[account(
        mut, 
        associated_token::mint = sol_mint, 
        associated_token::authority = vault
    )]
    pub sol_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        associated_token::mint = usdc_mint, 
        associated_token::authority = vault
    )]
    pub usdc_vault: Account<'info, TokenAccount>,
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub sol_mint: Account<'info, Mint>, 
    pub usdc_mint: Account<'info, Mint>,
}

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct CreateJob<'info> {
    #[account (
        init,
        payer = authority,
        space = 8 + 32 + 8 + 1 + 4 + 256,
        seeds = [b"job", authority.key().as_ref(), &job_id.to_le_bytes()],
        bump
    )]
    pub job : Account<'info, Job>,
    #[account(mut)]
    pub authority : Signer<'info>,
    pub system_program : Program<'info, System>
}

#[derive(Accounts)]
pub struct ExecuteJob<'info> {
    #[account (
        mut,
        has_one = authority,
        seeds = [b"job", authority.key().as_ref(), &job.job_id.to_le_bytes()],
        bump
    )]
    pub job : Account<'info, Job>,
    #[account(mut)]
    pub authority : Signer<'info>
}

#[account]
pub struct Job {
    pub authority : Pubkey,
    pub job_id : u64,
    pub status : JobStatus,
    pub result : Vec<u8>
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum JobStatus {
    Pending,
    Completed,
    Failed,
}