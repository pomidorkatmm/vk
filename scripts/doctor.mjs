const major = Number(process.versions.node.split('.')[0]);
if (major !== 24) {
  console.error(`Expected Node 24.x, got ${process.versions.node}`);
  process.exit(1);
}
console.log(`Node ${process.versions.node} OK`);
