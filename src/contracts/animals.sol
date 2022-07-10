// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract Recur{
    struct Animal{
        address payable owner;
        string name;
        string image;
        string description;
        uint amount;
        bool sold;
        uint timestamp;
    }

    uint uploadFee;
    uint releaseFee;
    address internal admin;
    constructor (){
       uploadFee = 1000000000000000000;
       releaseFee = 2000000000000000000;
       admin = msg.sender;
    }
    uint internal animalLength = 0;
    mapping (uint => Animal) internal animals;
    
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    
    
    modifier isOwner(uint _index) {
        require(msg.sender == animals[_index].owner,"Accessible only to the owner");
        _;
    }
    
    function addYourAnimal(
        string memory _name,
        string memory _image,
        string memory _description,
        uint amount
    )public{
        require(
              IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                admin,
                uploadFee
              ),    
              "This transaction could not be performed"
        );
        animals[animalLength] = Animal(
            payable(msg.sender),
            _name,
            _image,
            _description,
            amount,
            false,
            block.timestamp
        );
        
        animalLength++;
    }
    
    function getAnimals(uint _index) public view returns(
        address payable,
        string memory,
        string memory,
        string memory,
        uint,
        bool,
        uint
    ){
        Animal storage animal = animals[_index];
        return(
            animal.owner,
            animal.name,
            animal.image,
            animal.description,
            animal.amount,
            animal.sold,
            animal.timestamp
        );
    }

    function adoptAnimal(uint _index) public payable {
        require(
              IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                admin,
                animals[_index].amount * 1000000000000000000
              ),    
              "This transaction could not be performed"
        );
        animals[_index].sold = true;
    }

    function releaseAnimal(uint _index) public payable isOwner(_index){
        require(
              IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                admin,
                releaseFee
              ),    
              "This transaction could not be performed"
        );
        animals[_index].sold = false;
    }
    
    function getAnimalLength() public view returns (uint){
        return animalLength;
    }
}