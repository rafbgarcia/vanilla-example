;(() => {
  // Update variables below as necessary
  const PROD_HOSTNAME = 'YOUR_PRODUCTION_HOSTNAME';
  const optimizeOnlyInProduction = true;

  const origin = new URL(location.href).origin;
  const isProduction = origin.includes(PROD_HOSTNAME) || !origin.includes('localhost') && !origin.includes('127.0.0.1');

  document.querySelectorAll('img[data-src]').forEach((img) => {
    const { width, height } = img;
    const { src, transformations = "" } = img.dataset;
    const transformationsObject = transformationsAsObject(transformations);
    transformationsObject.width ||= width === 0 ? undefined : width;
    transformationsObject.height ||= height === 0 ? undefined : height;

    img.loading = 'lazy';
    img.decoding = 'async';

    if (optimizeOnlyInProduction && !isProduction) {
      img.src = img.dataset.src;
    } else if (src.startsWith('http')) {
      img.src = optimizedSrc(src, transformationsObject);
      img.srcset = optimizedSrcSet(src, transformationsObject);
    } else if (isProduction) {
      // 'src' is a relative path, e.g. "/images/example.jpg"
      img.src = optimizedSrc(`${origin}${src}`, transformationsObject);
      img.srcset = optimizedSrcSet(src, transformationsObject);
    } else {
      img.src = img.dataset.src;
    }
  });


  function optimizedSrc(src, transformationsObject) {
    return `https://quickr-cdn.quickr.dev/${transformationsAsString(transformationsObject)}/${src}`
  }

  function optimizedSrcSet(src, transformationsObject) {
    transformationsObject.fit ||= "scale-down";

    if (transformationsObject.width) {
      return `
        ${optimizedSrc(src, transformationsObject)} 1x,
        ${optimizedSrc(src, {...transformationsObject, width: Math.min(transformationsObject.width * 2, 1920)})} 2x
      `;
    } else {
      return `
        ${optimizedSrc(src, {...transformationsObject, width: 640})} 640w,
        ${optimizedSrc(src, {...transformationsObject, width: 960})} 960w,
        ${optimizedSrc(src, {...transformationsObject, width: 1200})} 1200w,
        ${optimizedSrc(src, {...transformationsObject, width: 1600})} 1600w,
        ${optimizedSrc(src, {...transformationsObject, width: 1920})} 1920w
      `;
    }
  }

  /**
   * @param {String} transformations e.g. 'width=800,fit=scale-down'
   * @return {Object} e.g. {width: 800, fit: 'scale-down'}
   */
  function transformationsAsObject(transformations) {
    return Object.fromEntries(
      transformations.split(',').filter(Boolean).map(pair => {
        const [key, value] = pair.split('=');
        return [key, isNaN(value) ? value : Number(value)];
      })
    );
  }

  /**
   * @param {Object} transformations e.g. {width: 800, fit: 'scale-down'}
   * @return {String} e.g. 'width=800,fit=scale-down'
   */
  function transformationsAsString(transformationsObject) {
    return Object.entries(transformationsObject)
      .filter(([_key, value]) => Boolean(value))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
  }
})();
