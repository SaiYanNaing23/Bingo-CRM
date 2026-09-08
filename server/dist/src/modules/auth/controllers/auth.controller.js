"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.login = exports.register = void 0;
const response_1 = require("../../../shared/utils/response");
const auth_service_1 = require("../services/auth.service");
const auth_validators_1 = require("../validators/auth.validators");
const register = async (req, res) => {
    const payload = (0, auth_validators_1.validateRegister)(req.body);
    const result = await (0, auth_service_1.register)(payload);
    (0, response_1.sendSuccess)(res, result, 201);
};
exports.register = register;
const login = async (req, res) => {
    const payload = (0, auth_validators_1.validateLogin)(req.body);
    const result = await (0, auth_service_1.login)(payload);
    (0, response_1.sendSuccess)(res, result);
};
exports.login = login;
const me = async (req, res) => {
    (0, response_1.sendSuccess)(res, { user: req.user ?? null });
};
exports.me = me;
//# sourceMappingURL=auth.controller.js.map