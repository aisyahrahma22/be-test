import { Request, Response } from 'express';
import * as AuthService from '$services/AuthService'; 
import { handleServiceErrorWithResponse, response_success } from '$utils/response.utils';

export async function register(req: Request, res: Response): Promise<Response> {
  const { firstName, lastName, phoneNumber, country, email, password, role, about } = req.body;
  const serviceResponse = await AuthService.register(firstName, lastName, phoneNumber, country, email, password, role, about);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(res, serviceResponse);
  }

  return response_success(res, serviceResponse.data, 'Registration successful');
}

export async function login(req: Request, res: Response): Promise<Response> {
  const { email, password } = req.body;

  const serviceResponse = await AuthService.login(email, password);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(res, serviceResponse); 
  }

  return response_success(res, serviceResponse.data, 'Login successful');
}
