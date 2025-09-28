use anchor_lang::prelude::*;

declare_id!("55vC9xRc26b51TkVPw3hdDBhqSfzC3EQ3EJ8qys6LHNr");

#[program]
pub mod onchain_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
