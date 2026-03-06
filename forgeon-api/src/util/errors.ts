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

export class ForbiddenError extends ApiError {
    constructor(message: string) {
        super(403, message);
        this.name = "ForbiddenError";
    }
}

export class WorkoutPlanNotActiveError extends ApiError {
    constructor(message: string) {
        super(400, message);
        this.name = "WorkoutPlanNotActiveError";
    }
}

export class WorkoutSessionAlreadyStartedError extends ApiError {
    constructor(message: string) {
        super(409, message);
        this.name = "WorkoutSessionAlreadyStartedError";
    }
}
