import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Filters API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/list/getfiltersdata returns pagination fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/list/getfiltersdata?channeid=0&ids=0,0,0,0,0&page=1')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('list');
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('page', 1);
    expect(res.body.data).toHaveProperty('size');
    expect(res.body.data).toHaveProperty('hasMore');
  });

  it('ignores ids type when channeid is numeric > 0', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/list/getfiltersdata?channeid=1&ids=0,2,0,0,0&page=1')
      .expect(200);

    expect(res.body).toHaveProperty('code', 200);
    // 无强断言数据内容，只验证请求不报错且返回结构完整
    expect(res.body.data).toHaveProperty('list');
  });
});


