import axios from 'axios';
import { Command } from 'commander';

const program = new Command();

program
  .action(async () => {
    const executorUrl = 'http://localhost:3000/jobs';

    console.log(`Submitting job to executor at ${executorUrl}`);

    try {
      const response = await axios.post(executorUrl, {
        jobId: Date.now(),
      });

      console.log('Job submitted successfully!');
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Failed to submit job:');
      console.log(error)
    //   const errorMessage = (error.response?.data as any)?.message || error.message;
    //   console.error(errorMessage);
    }
  });

program.parse(process.argv);