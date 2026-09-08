"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = exports.validateRegister = void 0;
const auth_dto_1 = require("../dto/auth.dto");
const validateRegister = (data) => auth_dto_1.registerSchema.parse(data);
exports.validateRegister = validateRegister;
const validateLogin = (data) => auth_dto_1.loginSchema.parse(data);
exports.validateLogin = validateLogin;
//# sourceMappingURL=auth.validators.js.map