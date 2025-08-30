import { Controller, Get, Post } from '@nestjs/common';

@Controller('admin/test-ingest')
export class TestIngestController {
  
  @Get()
  async testGet() {
    return { message: 'Test Ingest GET endpoint works!', timestamp: new Date().toISOString() };
  }

  @Post()
  async testPost() {
    return { message: 'Test Ingest POST endpoint works!', timestamp: new Date().toISOString() };
  }
}
