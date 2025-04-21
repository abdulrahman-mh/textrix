export async function uploadImage({ file }: { file: File }) {
  // Wait for a random time between 500ms and 2000ms
  const delay = Math.floor(Math.random() * 1500) + 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Randomly fail 50% of the time
  // if (Math.random() < 0.5) {
  //   throw new Error('Random upload failure');
  // }

  // Randomly generate width (300–3000) and height (200–1000)
  const width = Math.floor(Math.random() * (3000 - 300 + 1)) + 300;
  const height = Math.floor(Math.random() * (1000 - 200 + 1)) + 200;

  // Return a fake image URL with random dimensions
  return {
    url: `https://fakeimg.pl/${width}x${height}/?text=${width} * ${height}`,
  };
}
