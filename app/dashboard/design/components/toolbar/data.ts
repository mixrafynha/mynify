export * from "../data";

export const PRINT_IMAGE_LIMITS = {
  maxBytes: 25 * 1024 * 1024,
};

export const bytesToMb = (bytes:number)=>bytes/1024/1024;

export function validatePrintImage(file: File){
 if(file.size>PRINT_IMAGE_LIMITS.maxBytes){
   return {ok:false,error:`Image is too large. Max ${bytesToMb(PRINT_IMAGE_LIMITS.maxBytes).toFixed(0)}MB.`};
 }
 return {ok:true,error:null};
}
