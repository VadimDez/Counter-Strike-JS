/**
 * Created by Vadym Yatsyuk on 25.02.18
 */

export const download = (
  path: string,
  type: XMLHttpRequestResponseType,
  callback: Function
) => {
  let req = new XMLHttpRequest();
  req.open('GET', path, true);
  req.responseType = type;

  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if (req.status === 200 || req.status === 0) {
        if (type === 'arraybuffer') {
          callback(new Uint8Array(req.response));
        } else {
          callback(req.response);
        }
      }
    }
  };

  req.send(null);
};
