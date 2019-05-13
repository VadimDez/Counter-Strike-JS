/**
 * Created by Vadym Yatsyuk on 25.02.18
 */

export const download = <T>(
  path: string,
  type: XMLHttpRequestResponseType,
  plain = false
) => {
  return new Promise<T>(resolve => {
    let req = new XMLHttpRequest();
    req.open('GET', path, true);
    req.responseType = type as any;

    req.onreadystatechange = function() {
      if (req.readyState === 4 && (req.status === 200 || req.status === 0)) {
        if (type === 'arraybuffer') {
          resolve(!plain ? new Uint8Array(req.response) : req.response);
        } else {
          resolve(req.response);
        }
      }
    };

    req.send(null);
  });
};
