const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('🚀 Starting FHEVM initialization test...');

    // 1. 检测FHEVM节点
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    try {
      const metadata = await provider.send('fhevm_relayer_metadata', []);
      console.log('✅ FHEVM node detected!');
      console.log('📋 Metadata:', metadata);
    } catch (error) {
      console.log('⚠️  FHEVM metadata not available, this might be a regular Hardhat node');
      console.log('   Error:', error.message);
    }

    // 2. 检查FHEVM插件
    if (typeof hre.fhevm === 'undefined') {
      throw new Error('FHEVM plugin not available');
    }
    console.log('✅ FHEVM plugin is available');

    // 3. 初始化FHEVM CLI API (关键步骤!)
    try {
      await hre.fhevm.initializeCLIApi();
      console.log('✅ FHEVM CLI API initialized successfully');
    } catch (error) {
      console.log('❌ FHEVM CLI API initialization failed:', error.message);
      throw error;
    }

    // 4. 创建FHEVM实例
    try {
      const fhevmInstance = await hre.fhevm.createInstance();
      console.log('✅ FHEVM instance created successfully');
    } catch (error) {
      console.log('❌ FHEVM instance creation failed:', error.message);
      throw error;
    }

    // 5. 测试合约部署
    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // 最新部署的地址
    const [deployer] = await ethers.getSigners();
    
    console.log('📋 Using contract address:', contractAddress);
    console.log('📋 Deployer address:', deployer.address);

    // 6. 测试加密输入创建
    try {
      const input = hre.fhevm.createEncryptedInput(contractAddress, deployer.address);
      input.add32(42);
      console.log('✅ Encrypted input created successfully');
      
      const encryptedInput = await input.encrypt();
      console.log('✅ Input encrypted successfully');
      console.log('📋 Encrypted handles:', encryptedInput.handles);
    } catch (error) {
      console.log('❌ Encryption test failed:', error.message);
      throw error;
    }

    console.log('🎉 FHEVM functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📋 Full error:', error);
    process.exit(1);
  }
}

main().catch(console.error);

