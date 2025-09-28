#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const HARDHAT_NODE_URL = 'http://localhost:8545';

async function checkHardhatNode() {
  try {
    const curlCommand = `curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' ${HARDHAT_NODE_URL}`;
    
    const { stdout, stderr } = await execAsync(curlCommand);
    
    if (stderr) {
      console.log('❌ Hardhat node is not running');
      console.log('Please start it with: npm run node');
      process.exit(1);
    }
    
    const response = JSON.parse(stdout);
    if (response.result) {
      const chainId = parseInt(response.result, 16);
      console.log(`✅ Hardhat node is running on chain ID: ${chainId}`);
      process.exit(0);
    } else {
      console.log('❌ Invalid response from Hardhat node');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Hardhat node is not running');
    console.log('Please start it with: npm run node');
    process.exit(1);
  }
}

checkHardhatNode();

