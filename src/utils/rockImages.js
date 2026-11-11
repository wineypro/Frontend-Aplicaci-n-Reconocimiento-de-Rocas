// src/utils/rockImages.js

const BLOCK_IMAGES = {
  basalto: require('../../assets/blocks/basalto.png'),
  granito: require('../../assets/blocks/granito.png'),
  arenisca: require('../../assets/blocks/arenisca.png'),
  pizarra: require('../../assets/blocks/pizarra.png')
};

export const getLocalBlockImage = (rock) => {
  if (!rock) return null;

  const rawName = typeof rock === 'string'
    ? rock
    : `${rock?.name || ''} ${rock?.scientificName || ''}`;
  const name = rawName.toLowerCase().trim();

  if (name.includes('basalto') || name === 'basalt' || name.includes('basalt')) {
    return BLOCK_IMAGES.basalto;
  }
  if (name.includes('granito') || name === 'granite' || name.includes('granite')) {
    return BLOCK_IMAGES.granito;
  }
  if (name.includes('arenisca') || name === 'sandstone' || name.includes('sandstone')) {
    return BLOCK_IMAGES.arenisca;
  }
  if (name.includes('pizarra') || name === 'slate' || name.includes('slate')) {
    return BLOCK_IMAGES.pizarra;
  }

  return null;
};

export const getRockImageSource = (rock) => {
  if (!rock) return null;

  const imgUrl = rock?.imgUrl || rock?.image_url || '';

  // 1. Si tiene foto tomada con el escáner en Base64
  if (typeof imgUrl === 'string' && imgUrl.startsWith('data:image/')) {
    return { uri: imgUrl };
  }

  // 2. Si es una de las 4 rocas base (Basalto, Granito, Arenisca, Pizarra)
  const localBlock = getLocalBlockImage(rock);
  if (localBlock) {
    return localBlock;
  }

  // 3. Si tiene URL externa real (que no sea placeholder ni default.jpg)
  if (
    typeof imgUrl === 'string' &&
    (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) &&
    !imgUrl.includes('via.placeholder.com') &&
    !imgUrl.includes('example.')
  ) {
    return { uri: imgUrl };
  }

  // 4. Si no tiene foto (ej. descubierta por fusión pendiente de fotografiar), devuelve null para mostrar el símbolo especial
  return null;
};