class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = "ApiError";
    }
}

export class NotFoundError extends ApiError {
    constructor(message: string) {
        super(404, message);
        this.name = "NotFoundError";
    }
}

export class BadRequestError extends ApiError {
    constructor(message: string) {
        super(400, message);
        this.name = "BadRequestError";
    }
}

export class InternalServerError extends ApiError {
    constructor(message: string) {
        super(500, message);
        this.name = "InternalServerError";
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string) {
        super(401, message);
        this.name = "UnauthorizedError";
    }
}
