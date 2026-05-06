async function test() {
  try {
    console.log('Registering...');
    const regRes = await fetch('https://app-agendaku-production.up.railway.app/api/auth/register', {
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
    const logRes = await fetch('https://app-agendaku-production.up.railway.app/api/auth/login', {
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
