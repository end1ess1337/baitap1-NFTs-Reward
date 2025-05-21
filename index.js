// Import các thư viện cần thiết
const express = require('express');
const { ethers } = require('ethers');
require('dotenv').config();

// Khởi tạo ứng dụng Express
const app = express();

// Cấu hình view engine và thư mục static
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Khởi tạo provider để kết nối với mạng BASE Mainnet thông qua Alchemy
const provider = new ethers.providers.JsonRpcProvider(
  `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
);

// ABI tối thiểu để đọc thông tin NFT
const minimalNFTABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)'
];

// Khởi tạo contract instance
const nftContract = new ethers.Contract(
  process.env.NFT_CONTRACT_ADDRESS,
  minimalNFTABI,
  provider
);

// Route chính hiển thị form nhập địa chỉ ví
app.get('/', (req, res) => {
  res.render('index');
});

// API endpoint để lấy danh sách NFT của một địa chỉ ví
app.get('/nfts/:address', async (req, res) => {
  try {
    const walletAddress = req.params.address;

    // Kiểm tra địa chỉ ví hợp lệ
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new Error('Địa chỉ ví không hợp lệ');
    }

    // Lấy số lượng NFT của ví
    const balance = await nftContract.balanceOf(walletAddress);
    const nfts = [];

    // Lấy thông tin của từng NFT
    for (let i = 0; i < balance; i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(walletAddress, i);
      const tokenURI = await nftContract.tokenURI(tokenId);

      // Lấy metadata của NFT
      const response = await fetch(tokenURI);
      const metadata = await response.json();

      nfts.push({
        tokenId: tokenId.toString(),
        name: metadata.name,
        image: metadata.image,
        attributes: metadata.attributes
      });
    }

    res.json({ success: true, nfts });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});