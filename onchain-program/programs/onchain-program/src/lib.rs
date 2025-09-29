use anchor_lang::prelude::*;

declare_id!("55vC9xRc26b51TkVPw3hdDBhqSfzC3EQ3EJ8qys6LHNr");

#[program]
pub mod onchain_program {
    use super::*;

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