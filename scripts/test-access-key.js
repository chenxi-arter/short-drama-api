const { AccessKeyUtil } = require('./dist/src/shared/utils/access-key.util');

// 测试AccessKey生成
try {
  const testKey = AccessKeyUtil.generateFromString('test-simple-001:6:720p');
  console.log('Generated AccessKey:', testKey);
  console.log('AccessKey length:', testKey.length);
  console.log('AccessKey is valid:', AccessKeyUtil.isValidAccessKey(testKey));
} catch (error) {
  console.error('Error generating AccessKey:', error);
}
