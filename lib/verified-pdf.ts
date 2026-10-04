export async function verifiedPdfResponse(response: Response): Promise<ReadableStream<Uint8Array> | null> {
  if (!response.ok || !response.body || !/^application\/(?:pdf|octet-stream)(?:;|$)/i.test(response.headers.get('content-type') || '')) {
    await response.body?.cancel();
    return null;
  }
  const reader=response.body.getReader(),chunks: Uint8Array[]=[];
  let size=0;
  while(size<5){const chunk=await reader.read();if(chunk.done)break;chunks.push(chunk.value);size+=chunk.value.length;}
  const prefix=new Uint8Array(size);let offset=0;for(const chunk of chunks){prefix.set(chunk,offset);offset+=chunk.length;}
  if(new TextDecoder().decode(prefix.slice(0,5))!=='%PDF-'){await reader.cancel();return null;}
  return new ReadableStream({
    start(controller){for(const chunk of chunks)controller.enqueue(chunk);},
    async pull(controller){try{const chunk=await reader.read();if(chunk.done)controller.close();else controller.enqueue(chunk.value);}catch(error){controller.error(error);}},
    cancel(reason){return reader.cancel(reason);}
  });
}
