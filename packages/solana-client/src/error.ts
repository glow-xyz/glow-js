export interface IGlowErrorOptions {
  code?: string;
  statusCode?: number;
  extraData?: { [key: string]: any };
}

export class GlowError extends Error {
  public code: string | null;
  public statusCode: number;
  public extraData: { [key: string]: any };

  constructor(message = "", options: IGlowErrorOptions = {}) {
    const { statusCode = 500, code = null, extraData = null } = options;

    super(message);

    this.name = "GlowError";
    this.code = code;
    this.statusCode = statusCode;
    this.extraData = extraData!;

    Object.setPrototypeOf(this, GlowError.prototype);
  }
}
