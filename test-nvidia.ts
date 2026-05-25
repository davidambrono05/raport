// Quick test script for NVIDIA API integration
import { getNVIDIAClient } from './src/integrations/nvidia/client';

async function quickTest() {
  try {
    console.log('Testing NVIDIA API integration for Electrician Client...');

    const client = getNVIDIAClient();

    const response = await client.simpleChat(
      'Test message from Electrician Client System',
      'You are a helpful assistant. Respond with "NVIDIA API working for electrician system!"'
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