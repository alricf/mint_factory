/////////////////MintFactory.sol////////////////
// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721Enumerable.sol";
import "./Ownable.sol";

contract MintFactory is ERC721Enumerable, Ownable {
    using Strings for uint256;

    uint256 public cost = 1 wei;
    string public baseExtension = ".json";
    uint256 maxSupply = 1000;

    mapping(uint256 => string) public ownership;

    event Mint(uint256 amount, address minter);
    event Withdraw(uint256 amount, address owner);

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {}

    function getTotalSupply() public view returns (uint256) {
        return totalSupply();
    }

    function mint(
        uint256 _mintAmount,
        string[] memory _NFTMetadataBaseURIs
    ) public payable {
        // Must mint at least 1 token
        require(_mintAmount > 0, "must mint at least 1 token");

        // Require enough payment
        require(msg.value == cost * _mintAmount, "insufficient payment");

        uint256 supply = getTotalSupply();

        // Do not let them mint more tokens than available
        require(supply + _mintAmount <= maxSupply, "max supply minted");

        // Ensure the number of metadata URIs matches the mint amount
        require(
            _NFTMetadataBaseURIs.length == _mintAmount,
            "NFT metadata base URI vs mint amount count mismatch"
        );

        // Create tokens
        for (uint256 i = 0; i < _mintAmount; i++) {
            // Mint NFT token
            _safeMint(msg.sender, supply + i + 1);

            // Update ownership mapping with token id and NFT metadata base URI
            ownership[supply + i + 1] = _NFTMetadataBaseURIs[i];
        }

        // Emit event
        emit Mint(_mintAmount, msg.sender);
    }

    // Return metadata base URI based on token id received
    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        // Check if token exists
        require(_exists(_tokenId), "token does not exist");

        string memory baseURI = ownership[_tokenId];

        // Return URI
        return string(abi.encodePacked(baseURI));
    }

    // Returns token ids owned by wallet address
    function walletOfOwner(
        address _owner
    ) public view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    // Owner functions
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success);

        emit Withdraw(balance, msg.sender);
    }

    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }

    function setMaxSupply(uint256 _newMaxSupply) public onlyOwner {
        maxSupply = _newMaxSupply;
    }
}
