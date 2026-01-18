import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/transaction.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // Stub authentication - use environment variables
    const validUsername = process.env.DEMO_USERNAME || 'demo@nirnai.com';
    const validPassword = process.env.DEMO_PASSWORD || 'Demo@123';

    if (loginDto.username === validUsername && loginDto.password === validPassword) {
      const payload = { username: loginDto.username, sub: 1 };
      const token = this.jwtService.sign(payload);

      return {
        success: true,
        message: 'Login successful',
        data: {
          accessToken: token,
          user: {
            username: loginDto.username,
          },
        },
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  @Post('validate')
  async validateToken(@Body() body: { token: string }) {
    try {
      const decoded = this.jwtService.verify(body.token);
      return {
        success: true,
        data: decoded,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
