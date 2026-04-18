export const PORT = Number(process.env.PORT ?? 3000);
export const IS_DEV = process.env.NODE_ENV === "development";
export const CSP =
	"require-trusted-types-for 'script'; trusted-types redeal default;";
