// Test DeepSeek API connection
// Usage: node test-deepseek.js YOUR_API_KEY

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Usage: node test-deepseek.js YOUR_API_KEY');
  process.exit(1);
}

async function testDeepSeek() {
  console.log('Testing DeepSeek API...');
  console.log('API Key format:', apiKey.substring(0, 10) + '...');
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Say "Hello World"' }],
        stream: false
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error:', JSON.stringify(errorJson, null, 2));
      } catch {}
      process.exit(1);
    }

    const data = await response.json();
    console.log('Success! Response:', JSON.stringify(data, null, 2));
    console.log('\nContent:', data?.choices?.[0]?.message?.content);
  } catch (error) {
    console.error('Request failed:', error.message);
    process.exit(1);
  }
}

testDeepSeek();
