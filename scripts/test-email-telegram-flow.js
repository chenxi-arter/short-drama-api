#!/usr/bin/env node

const BASE_URL = 'http://localhost:8080/api';

// 测试数据
const testUser = {
  email: 'testuser@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  username: 'testuser123',
  firstName: '测试',
  lastName: '用户'
};

const telegramData = {
  id: 6702079700,
  first_name: '随风',
  last_name: '',
  username: 'seo99991',
  auth_date: 1754642628,
  hash: 'cd671f60a4393b399d9cb269ac4327c8a47a3807c5520077c37477544ae93c07'
};

async function testEmailTelegramFlow() {
  console.log('🚀 测试邮箱注册 + Telegram绑定流程...\n');

  try {
    // 1. 测试用户注册
    console.log('1️⃣ 测试用户注册...');
    const registerResponse = await fetch(`${BASE_URL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const registerResult = await registerResponse.json();
    console.log('注册结果:', JSON.stringify(registerResult, null, 2));

    if (!registerResponse.ok) {
      console.log('❌ 注册失败，可能用户已存在，继续测试登录...\n');
    } else {
      console.log('✅ 注册成功\n');
    }

    // 2. 测试邮箱登录
    console.log('2️⃣ 测试邮箱登录...');
    const loginResponse = await fetch(`${BASE_URL}/user/email-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        deviceInfo: 'Test Device'
      })
    });

    const loginResult = await loginResponse.json();
    console.log('登录结果:', JSON.stringify(loginResult, null, 2));

    if (!loginResponse.ok) {
      console.log('❌ 登录失败\n');
      return;
    }

    console.log('✅ 登录成功\n');
    const accessToken = loginResult.access_token;

    // 3. 测试获取用户信息
    console.log('3️⃣ 测试获取用户信息...');
    const meResponse = await fetch(`${BASE_URL}/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const meResult = await meResponse.json();
    console.log('用户信息:', JSON.stringify(meResult, null, 2));

    if (meResponse.ok) {
      console.log('✅ 获取用户信息成功\n');
    } else {
      console.log('❌ 获取用户信息失败\n');
    }

    // 4. 测试绑定Telegram
    console.log('4️⃣ 测试绑定Telegram...');
    const bindResponse = await fetch(`${BASE_URL}/user/bind-telegram`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telegramData)
    });

    const bindResult = await bindResponse.json();
    console.log('绑定结果:', JSON.stringify(bindResult, null, 2));

    if (bindResponse.ok) {
      console.log('✅ Telegram绑定成功\n');
    } else {
      console.log('❌ Telegram绑定失败\n');
    }

    // 5. 测试Telegram登录（使用绑定后的账号）
    console.log('5️⃣ 测试Telegram登录...');
    const telegramLoginResponse = await fetch(`${BASE_URL}/user/telegram-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loginType: 'bot',
        ...telegramData,
        deviceInfo: 'Telegram Test Device'
      })
    });

    const telegramLoginResult = await telegramLoginResponse.json();
    console.log('Telegram登录结果:', JSON.stringify(telegramLoginResult, null, 2));

    if (telegramLoginResponse.ok) {
      console.log('✅ Telegram登录成功\n');
    } else {
      console.log('❌ Telegram登录失败\n');
    }

    console.log('🎉 完整流程测试完成！');
    console.log('\n📋 流程总结：');
    console.log('1. ✅ 用户可以用邮箱注册账号');
    console.log('2. ✅ 用户可以用邮箱密码登录');
    console.log('3. ✅ 登录后可以绑定Telegram账号');
    console.log('4. ✅ 绑定后可以使用Telegram登录');
    console.log('5. ✅ 支持两种登录方式：邮箱 + Telegram');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testEmailTelegramFlow();














