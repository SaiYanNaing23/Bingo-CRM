import type { LoginInput, RegisterInput } from "../dto/auth.dto";
import type { AuthTokenPayload } from "../types/auth.types";
export declare const register: (input: RegisterInput) => Promise<AuthTokenPayload>;
export declare const login: (input: LoginInput) => Promise<AuthTokenPayload>;
//# sourceMappingURL=auth.service.d.ts.map