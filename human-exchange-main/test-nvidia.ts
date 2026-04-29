// Quick test script for NVIDIA API integration
import { getNVIDIAClient } from './src/integrations/nvidia/client';

async function quickTest() {
  try {
    console.log('Testing NVIDIA API integration...');

    const client = getNVIDIAClient();

    const response = await client.simpleChat(
      'Test message from HUMANEX',
      'You are a helpful assistant. Respond with "NVIDIA API working!"'
    );

    console.log('✅ Success! Response:', response);
    console.log('✅ NVIDIA API integration is working correctly!');

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run test
quickTest().then(success => {
  process.exit(success ? 0 : 1);
});