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

contract Recur {
    struct Animal {
        address payable owner;
        string name;
        string image;
        string description;
        uint256 amount;
        bool adopted;
    }

    uint256 uploadFee;
    uint256 releaseFee;
    address private admin;

    constructor() {
        uploadFee = 1 ether;
        releaseFee = 2 ether;
        admin = msg.sender;
    }

    uint256 private animalLength = 0;

    mapping(uint256 => Animal) private animals;

    mapping(uint256 => bool) private exist;

    mapping(address => bool) private blacklisted;
    address private cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    modifier isOwner(uint256 _index) {
        require(
            msg.sender == animals[_index].owner,
            "Accessible only to the owner"
        );
        _;
    }

    modifier exists(uint256 _index) {
        require(exist[_index], "Query of non existent animal");
        _;
    }


    /// @notice amount is multiplied by one ether as amount is expected to not follow the 18 decimals convention for CUSD
    function addYourAnimal(
        string memory _name,
        string memory _image,
        string memory _description,
        uint256 amount
    ) public {
        require(bytes(_name).length > 0, "Empty name");
        require(bytes(_image).length > 0, "Empty image url");
        require(bytes(_description).length > 0, "Empty description");
        require(amount > 0 && amount <= 10000, "Invalid amount");
        if (msg.sender != admin) {
            require(
                IERC20Token(cUsdTokenAddress).transferFrom(
                    msg.sender,
                    admin,
                    uploadFee
                ),
                "This transaction could not be performed"
            );
        }
        amount = amount * 1 ether;
        animals[animalLength] = Animal(
            payable(msg.sender),
            _name,
            _image,
            _description,
            amount,
            false
        );

        animalLength++;
    }

    function getAnimals(uint256 _index)
        public
        view
        exists(_index)
        returns (
            address payable,
            string memory,
            string memory,
            string memory,
            uint256,
            bool
        )
    {
        Animal memory animal = animals[_index];
        return (
            animal.owner,
            animal.name,
            animal.image,
            animal.description,
            animal.amount,
            animal.adopted
        );
    }

    function adoptAnimal(uint256 _index) external payable exists(_index) {
        require(!animals[_index].adopted, "Animal is already adopted");
        require(animals[_index].owner != msg.sender, "Invalid customer");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                admin,
                animals[_index].amount
            ),
            "This transaction could not be performed"
        );
        animals[_index].adopted = true;
    }

    /// @dev puts an animal back on the marketpalce
    function releaseAnimal(uint256 _index) external payable exists(_index) isOwner(_index) {
        require(animals[_index].adopted, "Animal isn't adopted");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                admin,
                releaseFee
            ),
            "This transaction could not be performed"
        );
        animals[_index].adopted = false;
    }

    /// @dev removes an animal from the platform, callable by admin or the animal's owner
    function removeAnimal(uint _index) external exists(_index) {
        exist[_index] = false;
        animals[_index] = animals[animalLength - 1];
        delete animals[animalLength - 1];
        animalLength--;
    }

    /// @dev allows a user to blacklist bad actors from the platform
    function blacklistUser(address user) external {
        require(msg.sender == admin, "Unauthorized caller");
        require(user != address(0) && !isBlacklisted(user), "Invalid user");
        blacklisted[user] = true;
    }

    /// @dev checks if a user has been blacklisted
    function isBlacklisted(address user) public view returns (bool){
        return blacklisted[user];
    }

    /// @dev finds all the animals available
    function getAllAnimals() public view returns (Animal[] memory){
        Animal[] memory allAnimals = new Animal[](animalLength);
        uint index = 0;
        while(index < animalLength){
            allAnimals[index] = animals[index];
            index++;
        } 
        return allAnimals;
    }



    function getAnimalLength() public view returns (uint256) {
        return animalLength;
    }
}
