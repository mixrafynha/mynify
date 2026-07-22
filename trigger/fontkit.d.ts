declare module "fontkit" {
  export function create(buffer: Buffer): unknown;

  const fontkit: {
    create: typeof create;
  };

  export default fontkit;
}
