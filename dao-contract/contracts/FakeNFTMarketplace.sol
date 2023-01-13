// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FakeNFTMarketplace {

    // Maps tokenIDs to Owners
    mapping(uint256 => address) public tokens;

    uint256 constant public nftPrice = 0.001 ether;

    // purchase() takes some ETH, and marks the msg.sender address, as the owner of some nft
    function purchase(uint256 _tokenId) external payable{
        require(msg.value == nftPrice,"Not Enough ETH");
        require(tokens[_tokenId]== address(0),"Not for Sale");

        tokens[_tokenId] = msg.sender;
    }

    function getPrice() external pure returns (uint256){
        return nftPrice;
    }

    function available(uint256 _tokenId) external view returns (bool){
        if(tokens[_tokenId]==address(0)){
            return true;
        }
        return false;
    }
}