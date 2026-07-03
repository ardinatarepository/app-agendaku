async function test() {
  try {
    console.log('Registering...');
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Login',
        email: 'testlogin55@gmail.com',
        password: 'password123'
      })
    });
    const regData = await regRes.json();
    console.log('Register Success:', regData);

    console.log('Logging in...');
    const logRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testlogin55@gmail.com',
        password: 'password123'
      })
    });
    const logData = await logRes.json();
    console.log('Login Success:', logData);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
