import { Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {execFile} from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const AGENT_IMAGE_ID = 'ZK_AGENT_IMAGE_ID'

const execFileSync = promisify(execFile);

@Injectable()
export class AgentService  {
  private readonly logger = new Logger(AgentService.name);

  private readonly hostPath = path.join (
    __dirname, '..', '..',
    '..',
    'zk-agent',
    'target',
    'release',
    'host'
  );

  async runAgentAndVerify() : Promise<Buffer> {

    try {
      const {stdout} = await execFileSync(this.hostPath, []);

      const receipt = JSON.parse(stdout);
      this.logger.log('Received receipt from ZK agent host.');

      if(!receipt.seal) {
        throw new Error('Verification failed: Seal is missing from receipt.');
      }
      this.logger.log(`Receipt verified successfully against Image ID: ${AGENT_IMAGE_ID}`);

      const journalBytes = Buffer.from(receipt.journal.bytes);
      this.logger.log(`Decoded journal of size : ${journalBytes.length}`);
      
      return journalBytes;
    }catch (error) {
      this.logger.error('Agent execution or verification failed:', error);
      throw new InternalServerErrorException('Failed to execute ZK agent.');
    }
  }
}
