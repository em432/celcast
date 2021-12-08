// SPDX-License-Identifier: MIT  

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract CelCast{
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    uint podcastLength = 0;

    struct Podcast{
        address payable owner;
        string title;
        string excerpt;
        string excerptImage;
        string audioLink;
        uint fans;
    }

    mapping (uint => Podcast) internal podcasts;

    modifier notOwner(uint _index) {
        require(msg.sender != podcasts[_index].owner, "You cant transact");
        _;
    } 

    // function to add podcasts
    function addPodcast(
        string memory _title,
        string memory _excerpt,
        string memory _excerptImage,
        string memory _audioLink
    )public{
        podcasts[podcastLength] = Podcast(
            payable(msg.sender),
            _title,
            _excerpt,
            _excerptImage,
            _audioLink,
            0
        );
        podcastLength++;
    }

    // function to get podcasts
    function getPodcast(uint _index)public view returns(
        address payable,
        string memory,
        string memory,
        string memory,
        string memory,
        uint
    ){
        return(
            podcasts[_index].owner,
            podcasts[_index].title,
            podcasts[_index].excerpt,
            podcasts[_index].excerptImage,
            podcasts[_index].audioLink,
            podcasts[_index].fans
        );
    }

    // function initiates payment transaction
    function supportPodcast(uint _index,  uint _amount) notOwner(_index) public payable{
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                podcasts[_index].owner,
                _amount
            ),
            "Transaction could not be performed"  
        );
        podcasts[_index].fans++;
    }

    function getPodcastLength() public view returns (uint) {
        return (podcastLength);
    }
}