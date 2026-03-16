import Joi from 'joi';
import { CreateLocationRequest, UpdateLocationRequest } from '../types/location/request';

export const createLocationSchema = Joi.object<CreateLocationRequest>({
  room_name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Tên phòng phải có ít nhất 1 ký tự',
    'string.max': 'Tên phòng không được vượt quá 100 ký tự',
    'any.required': 'Tên phòng là bắt buộc'
  }),
  location: Joi.string().min(1).max(200).required().messages({
    'string.min': 'Địa điểm phải có ít nhất 1 ký tự',
    'string.max': 'Địa điểm không được vượt quá 200 ký tự',
    'any.required': 'Địa điểm là bắt buộc'
  })
});

export const updateLocationSchema = Joi.object<UpdateLocationRequest>({
  room_name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Tên phòng phải có ít nhất 1 ký tự',
    'string.max': 'Tên phòng không được vượt quá 100 ký tự'
  }),
  location: Joi.string().min(1).max(200).optional().messages({
    'string.min': 'Địa điểm phải có ít nhất 1 ký tự',
    'string.max': 'Địa điểm không được vượt quá 200 ký tự'
  })
});