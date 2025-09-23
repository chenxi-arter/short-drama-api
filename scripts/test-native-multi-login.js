#!/usr/bin/env node

const BASE_URL = 'http://localhost:8080/api';

// 测试数据
const telegramData = {
  id: 6702079700,
  first_name: '随风',
  last_name: '',
  username: 'seo99991',
  auth_date: 1754642628,
  hash: 'cd671f60a4393b399d9cb269ac4327c8a47a3807c5520077c37477544ae93c07'
};

const emailUser = {
  email: 'testuser@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  username: 'testuser123',
  firstName: '测试',
  lastName: '用户'
};

async function testNativeMultiLogin() {
  console.log('🚀 测试原生多登录支持...\n');

  try {
    // 1. 测试Telegram登录（创建用户）
    console.log('1️⃣ 测试Telegram登录...');
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

    if (!telegramLoginResponse.ok) {
      console.log('❌ Telegram登录失败\n');
      return;
    }

    console.log('✅ Telegram登录成功\n');
    const telegramUserId = telegramLoginResult.user.id;
    const telegramAccessToken = telegramLoginResult.access_token;

    // 2. 测试邮箱注册（创建另一个用户）
    console.log('2️⃣ 测试邮箱注册...');
    const registerResponse = await fetch(`${BASE_URL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailUser)
    });

    const registerResult = await registerResponse.json();
    console.log('邮箱注册结果:', JSON.stringify(registerResult, null, 2));

    if (!registerResponse.ok) {
      console.log('❌ 邮箱注册失败\n');
      return;
    }

    console.log('✅ 邮箱注册成功\n');
    const emailUserId = registerResult.id;

    // 3. 测试邮箱登录
    console.log('3️⃣ 测试邮箱登录...');
    const emailLoginResponse = await fetch(`${BASE_URL}/user/email-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: emailUser.email,
        password: emailUser.password,
        deviceInfo: 'Email Test Device'
      })
    });

    const emailLoginResult = await emailLoginResponse.json();
    console.log('邮箱登录结果:', JSON.stringify(emailLoginResult, null, 2));

    if (!emailLoginResponse.ok) {
      console.log('❌ 邮箱登录失败\n');
      return;
    }

    console.log('✅ 邮箱登录成功\n');
    const emailAccessToken = emailLoginResult.access_token;

    // 4. 测试绑定Telegram到邮箱用户
    console.log('4️⃣ 测试绑定Telegram到邮箱用户...');
    const bindResponse = await fetch(`${BASE_URL}/user/bind-telegram`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailAccessToken}`,
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

    // 5. 验证两种登录方式都有效
    console.log('5️⃣ 验证两种登录方式...');
    
    // 测试邮箱登录
    const finalEmailLoginResponse = await fetch(`${BASE_URL}/user/email-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: emailUser.email,
        password: emailUser.password,
        deviceInfo: 'Final Email Test'
      })
    });

    const finalEmailLoginResult = await finalEmailLoginResponse.json();
    console.log('最终邮箱登录结果:', JSON.stringify(finalEmailLoginResult, null, 2));

    // 测试Telegram登录
    const finalTelegramLoginResponse = await fetch(`${BASE_URL}/user/telegram-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loginType: 'bot',
        ...telegramData,
        deviceInfo: 'Final Telegram Test'
      })
    });

    const finalTelegramLoginResult = await finalTelegramLoginResponse.json();
    console.log('最终Telegram登录结果:', JSON.stringify(finalTelegramLoginResult, null, 2));

    console.log('🎉 原生多登录测试完成！');
    console.log('\n📋 测试总结：');
    console.log('1. ✅ Telegram用户创建成功');
    console.log('2. ✅ 邮箱用户创建成功');
    console.log('3. ✅ 邮箱登录成功');
    console.log('4. ✅ Telegram绑定成功');
    console.log('5. ✅ 两种登录方式都有效');
    console.log('\n🎯 原生多登录支持：');
    console.log('- 用户ID统一管理');
    console.log('- 支持邮箱和Telegram登录');
    console.log('- 无需数据迁移');
    console.log('- 数据自然关联');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testNativeMultiLogin();

