import defaults from "lodash/defaults";

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
    const { statusCode, code, extraData } = defaults(options, {
      code: null,
      statusCode: 500,
      extraData: null,
    });

    super(message);

    this.name = "GlowError";
    this.code = code;
    this.statusCode = statusCode;
    this.extraData = extraData;

    Object.setPrototypeOf(this, GlowError.prototype);
  }
}
