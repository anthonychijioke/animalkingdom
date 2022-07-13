import { useState, useEffect } from "react";

import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";

import ierc from "./contracts/ierc.abi.json";
import animalAbi from "./contracts/animals.abi.json";

const ERC20_DECIMALS = 18;

const contractAddress = "0x0824e169231E8a1Fe617Dc192a43bC0fC2f473aF";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

function App() {
  const [contract, setcontract] = useState(null);
  const [address, setAddress] = useState(null);
  const [kit, setKit] = useState(null);
  const [cUSDBalance, setcUSDBalance] = useState(0);
  const [animals, setAnimals] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  const initializeWallet = async () => {
    if (window.celo) {
      try {
        await window.celo.enable();
        const web3 = new Web3(window.celo);
        let kit = newKitFromWeb3(web3);

        const accounts = await kit.web3.eth.getAccounts();
        const user_address = accounts[0];

        kit.defaultAccount = user_address;

        await setAddress(user_address);
        await setKit(kit);
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log("Error Occurred");
    }
  };

  const getBalance = async () => {
    try {
      const balance = await kit.getTotalBalance(address);
      const USDBalance = balance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
      const contract = new kit.web3.eth.Contract(animalAbi, contractAddress);
      setcontract(contract);
      setcUSDBalance(USDBalance);
    } catch (error) {
      console.log(error);
    }
  };

  const getAnimals = async () => {
    try {
      const animalsLength = await contract.methods.getAnimalLength().call();
      const animals = [];
      for (let index = 0; index < animalsLength; index++) {
        const animal = new Promise(async (resolve, reject) => {
          const _animal = await contract.methods.getAnimals(index).call();
          const date = new Date(_animal[6] * 1000);
          console.log(date);
          resolve({
            index: index,
            owner: _animal[0],
            name: _animal[1],
            image: _animal[2],
            description: _animal[3],
            amount: _animal[4],
            sold: _animal[5],
            timestamp: date,
          });
        });
        animals.push(animal);
      }
      const _animal = await Promise.all(animals);
      setAnimals(_animal);
    } catch (e) {
      console.log(e);
    }
  };


  const formSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!name || !amount || !description || !image) return;
      const cUSDContract = new kit.web3.eth.Contract(ierc, cUSDContractAddress);
      const uploadFee = new BigNumber(1).shiftedBy(ERC20_DECIMALS).toString();
      await cUSDContract.methods
        .approve(contractAddress, uploadFee)
        .send({ from: address });
      const tx = await contract.methods
        .addYourAnimal(name, image, description, amount)
        .send({
          from: address,
        });
      console.log(tx);
      getBalance();
      getAnimals();
    } catch (error) {
      console.log(error);
    }
  };

  const adoptAnimal = async (index) => {
    try {
      const cUSDContract = new kit.web3.eth.Contract(ierc, cUSDContractAddress);
      const amount = new BigNumber(animals[index].amount).shiftedBy(ERC20_DECIMALS).toString();
      await cUSDContract.methods
        .approve(contractAddress, amount)
        .send({ from: address });
      const tx = await contract.methods
        .adoptAnimal(index)
        .send({
          from: address,
        });
      getBalance();
      getAnimals()
    } catch (error) {
      console.log(error);
    }

  }

  const releaseAnimal = async (index) => {
    try {
      const cUSDContract = new kit.web3.eth.Contract(ierc, cUSDContractAddress);
      const amount = new BigNumber(2).shiftedBy(ERC20_DECIMALS).toString();
      await cUSDContract.methods
        .approve(contractAddress, amount)
        .send({ from: address });
      const tx = await contract.methods
        .releaseAnimal(index)
        .send({
          from: address,
        });
      getBalance();
      getAnimals()
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    initializeWallet();
  }, []);

  useEffect(() => {
    if (contract) {
      getAnimals();
    }
  }, [contract]);

  useEffect(() => {
    if (kit && address) {
      getBalance();
    }
  }, [kit, address]);
  return (
    <>
      <div>
        <header className="site-header sticky-top py-1">
          <nav className="container d-flex flex-column flex-md-row justify-content-between">
            <a className="py-2" href="#" aria-label="Product">
              <h3>Animal Kingdom</h3>
            </a>
            <a className="py-2 d-none d-md-inline-block" href="#">
              Balance: {cUSDBalance} cUSD
            </a>
          </nav>
        </header>
        <main>
          <div className="row row-cols-1 row-cols-md-3 mb-3 text-center">
            {animals.map(animal => <div className="col">
              <div className="card mb-4 rounded-3 shadow-sm">
                <div className="card-header py-3">
                  <h4 className="my-0 fw-normal">{animal.name}</h4>
                </div>
                <div className="card-body">
                  <h1 className="card-title pricing-card-title">${animal.amount}<small className="text-muted fw-light">cUSD</small></h1>
                  <img width={200} src={animal.image} alt=""/>
                  <p className="list-unstyled mt-3 mb-4">
                    {animal.description}
                  </p>
                  {!animal.sold ? <button type="button" onClick={() => adoptAnimal(animal.index)} className="w-100 btn btn-lg btn-outline-primary">Adopt Animal</button>
                    : animal.owner === address ?
                      <button type="button" onClick={() => releaseAnimal(animal.index)} className="w-100 btn btn-lg btn-outline-danger">Release Animal</button>
                      : "Not the owner"}
                </div>
              </div>
            </div>)}
          </div>
        </main>


        <div className="p-3 w-50 justify-content-center">
          <h2>Add your Animal to be Adopted</h2>
          <div className="">
            <form onSubmit={formSubmit}>
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control rounded-4"
                  id="floatingInput"
                  placeholder="Name"
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <label htmlFor="floatingInput">Name</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control rounded-4"
                  id="floatingInput"
                  placeholder="Amount"
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <label htmlFor="floatingInput">Amount</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  className="form-control rounded-4"
                  id="floatingInput"
                  placeholder="Description"
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <label htmlFor="floatingInput">Description</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  className="form-control rounded-4"
                  id="floatingInput"
                  placeholder="Image Url"
                  onChange={(e) => setImage(e.target.value)}
                  required
                />
                <label htmlFor="floatingInput">Image</label>
              </div>

              <button
                className="w-100 mb-2 btn btn-lg rounded-4 btn-primary"
                type="submit"
              >
                Add Your Animal
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
