import { useState, useEffect, useRef } from "react";
import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";

import celcast from "./contracts/celcast.abi.json";
import IERC from "./contracts/IERC.abi.json";

const ERC20_DECIMALS = 18;

const contractAddress = "0xE7B395e9C76e23126823ab12EA46597dF414d60b";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

function App() {
  const [celoBalance, setCeloBalance] = useState(0);
  const [contract, setcontract] = useState(null);
  const [address, setAddress] = useState(null);
  const [kit, setKit] = useState(null);
  const [cUSDBalance, setcUSDBalance] = useState(0);
  const [podcasts, setPodcast] = useState([]);
  const [index, setIndex] = useState(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [excerptImage, setExcerptImage] = useState("");
  const [audioLink, setAudioLink] = useState("");
  const [source, setSource] = useState();

  const audioRef = useRef();

  const updateSong = (source) => {
    setSource(source);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play();
    }
  };
  const connect = async () => {
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
      console.log("Not connected");
    }
  };

  const getBalance = async () => {
    try {
      const balance = await kit.getTotalBalance(address);
      const celoBalance = balance.CELO.shiftedBy(-ERC20_DECIMALS).toFixed(2);
      const USDBalance = balance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);

      const contract = new kit.web3.eth.Contract(celcast, contractAddress);
      setcontract(contract);
      setCeloBalance(celoBalance);
      setcUSDBalance(USDBalance);
    } catch (error) {
      console.log(error);
    }
  };

  const getPodcasts = async () => {
    const podcastLength = await contract.methods.getPodcastLength().call();
    const _podcasts = [];

    for (let index = 0; index < podcastLength; index++) {
      let _podcast = new Promise(async (resolve, reject) => {
        let p = await contract.methods.getPodcast(index).call();
        resolve({
          index: index,
          owner: p[0],
          title: p[1],
          excerpt: p[2],
          excerptImage: p[3],
          audioLink: p[4],
          supports: p[5],
        });
      });
      _podcasts.push(_podcast);
    }
    const podcast = await Promise.all(_podcasts);
    setPodcast(podcast);
  };

  const supportPodcast = async (_index, _amount) => {
    const cUSDContract = new kit.web3.eth.Contract(IERC, cUSDContractAddress);
    try {
      const amount = new BigNumber(_amount)
        .shiftedBy(ERC20_DECIMALS)
        .toString();
      await cUSDContract.methods
        .approve(contractAddress, amount)
        .send({ from: address });
      await contract.methods
        .supportPodcast(_index, amount)
        .send({ from: address });
      getBalance();
      getPodcasts();
    } catch (error) {
      console.log(error);
    }
  };

  const addPodcast = async (e) => {
    e.preventDefault();
    try {
      await contract.methods
        .addPodcast(title, excerpt, excerptImage, audioLink)
        .send({ from: address });
    } catch (error) {
      console.log(error);
    }
    getPodcasts();
  };
  useEffect(() => {
    connect();
  }, []);

  useEffect(() => {
    if (kit && address) {
      getBalance();
    } else {
      console.log("no kit");
    }
  }, [kit, address]);

  useEffect(() => {
    if (contract) {
      getPodcasts();
    }
  }, [contract]);

  return (
    <div>
      <header id="top" className="top-header">
        {/* Navigation */}
        <nav
          className="navbar navbar-default navbar-expand-lg"
          data-spy="affix"
          data-offset-top={400}
        >
          <div className="container-fluid">
            <a className="navbar-brand" href="index.html">
              {/* <img src="images/logo.png" alt="Site Logo" /> */}
              <h2>CELCAST</h2>
            </a>
            <button
              className="navbar-toggler navbar-toggle collapsed"
              type="button"
              data-toggle="collapse"
              data-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="icon-bar" />
              <span className="icon-bar" />
              <span className="icon-bar" />
            </button>
            <div
              className="collapse navbar-collapse"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav ml-auto">
                <li className="active">
                  <a href="">Home</a>
                </li>
                <li className="dropdown">
                  <a href="#">Balance</a>
                  <ul className="dropdown-menu">
                    <li>
                      <a href="#">cUSD: {cUSDBalance}</a>
                    </li>
                    <li>
                      <a href="#">CELO: {celoBalance}</a>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        {/* Navigation End */}
      </header>
      <div className="page-header"></div>
      <div className="main-wrap">
        <div className="section tracks-section text-white">
          <div className="overlay section-padding">
            <div className="container">
              <div className="row">
                <div className="col-lg-8 offset-lg-2 col-12">
                  <div className="section-header text-center">
                    <h3 className="section-title">Podcasts</h3>
                    <p className="section-subtext">
                      Listen to the most amazing podcasts on the blockchain
                    </p>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <div className="music-wrap">
                    <div className="row">
                      <div className="col-lg-4 col-md-5 col-12">
                        {podcasts
                          .filter((podcasts) => podcasts.index === index)
                          .map((podcast) => (
                            <div id="player-one" className="player-main-block">
                              <div className="album-art-block">
                                <div
                                  class="track-meta-info"
                                  id="meta-container"
                                >
                                  <span class="song-name">{podcast.title}</span>
                                  <div class="song-artist-album">
                                    - <span>{podcast.excerpt}</span>
                                  </div>
                                </div>
                                <div className="album-art-space">
                                  <img
                                    className="img-responsive"
                                    src={podcast.excerptImage}
                                    alt="..."
                                  />
                                </div>
                                <div id="" class="audio-controller-wrap">
                                  <div id="player-left-bottom">
                                    <audio
                                      style={{ width: "250px" }}
                                      className="text-center"
                                      controls
                                      ref={audioRef}
                                    >
                                      <source src={source} />
                                    </audio>
                                  </div>
                                </div>
                              </div>

                              <div className="text-center">
                              <span>{podcast.supports} likes  </span>
                                <i
                                  onClick={() =>
                                    supportPodcast(podcast.index, 2)
                                  }
                                  class="fa fa-2x fa-thumbs-up"
                                ></i>
                              </div>
                            </div>
                          ))}
                      </div>
                      <div className="col-lg-8 col-md-7 col-12 sm-top-m-30">
                        <div className="player-track-list-block">
                          {podcasts.map((podcast) => (
                            <div
                              className="song amplitude-song-container amplitude-play-pause"
                              amplitude-song-index={podcast.index}
                              data-song="audio/01-title-staff-roll.mp3"
                              data-cover={podcast.excerptImage}
                            >
                              <div className="song-meta-data">
                                <span className="song-title">
                                  {podcast.title}
                                </span>
                                <span className="song-artist">
                                  {podcast.excerpt}
                                </span>
                              </div>
                              <div className="play-now">
                                <a className="btn btn-sm btn-black">
                                  <span
                                    onClick={() => {
                                      setIndex(podcast.index);
                                      updateSong(podcast.audioLink);
                                    }}
                                    className="normal-state"
                                  >
                                    Play Now
                                  </span>
                                  <span className="play-state">Pause</span>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer>
        {/* Footer Subscribe */}
        <div className="subscription-area section-padding theme-bg">
          <div className="container">
            <div className="row">
              <h2>Add your Podcast to Celo</h2>
              <div className="col-md-8">
                <form onSubmit={addPodcast}>
                  <input
                    type="text"
                    placeholder="Title"
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Describe this podcast"
                    onChange={(e) => setExcerpt(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    onChange={(e) => setExcerptImage(e.target.value)}
                    placeholder="Podcast Image"
                    required
                  />
                  <input
                    type="text"
                    onChange={(e) => setAudioLink(e.target.value)}
                    placeholder="Audio Link"
                    required
                  />
                  <button type="submit" className="btn btn-white">
                    Add Podcast
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
