import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = Object.values(error.constraints || {});
          return `${error.property}: ${constraints.join(', ')}`;
        });
        return new BadRequestException(messages.join('; '));
      },
    }),
  );

  app.enableCors();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Auth Service running on http://localhost:${port}/graphql`);
}
bootstrap();
