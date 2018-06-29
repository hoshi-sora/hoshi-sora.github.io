var app = new Vue({
    el: '#app',
    data: {
        contractAddress: 'n1jREZN1guegkJo8heNGi3iu7hYgYZXgtZv',
        nebulas: '',
        neb: '',

        songListSize: -1,
        songList: [],

        newSongTitle: '',

        lyrics: [],

        showModal: false,
        showLyricsModal: false,
        showUploadLyricsModal: true,

        selectSong: '',
        selectLyricsIndex: -1,
        selectLyrics: '加载中……',
        songForAppendLyrics: '',
        lyricsToAppend: '',
    },
    created: function() {
        this.initWallet()
        this.fetchSongListSize()
        this.fetchSongList()
    },
    computed: {
        isUpdateLyricsModalUploadButtonActive: function () {
            return !(this.lyricsToAppend === '')
        },
        online: function () {
            return (typeof(webExtensionWallet) !== "undefined")
        }
    },
    methods: {
        initWallet: function () {
            var nebulas = require("nebulas"),
                neb = new nebulas.Neb()

            neb.setRequest(new nebulas.HttpRequest("https://mainnet.nebulas.io"))
            // neb.setRequest(new nebulas.HttpRequest("http://localhost:8685"))

            this.nebulas = nebulas
            this.neb = neb
        },
        newAccount: function () {
            var account = this.nebulas.Account.NewAccount().getAddressString()
            return account
        },
        fetchSongListSize: function () {
            var from = this.newAccount()
            var to = this.contractAddress
            var value = '0'
            var nonce = '0'
            var gas_price = '1000000'
            var gas_limit = '2000000'
            var contract = {
                "function": 'songArraySize',
                "args": '[]'
            }

            var vm = this
            this.neb.api.call(from, to, value, nonce, gas_price, gas_limit, contract).then(function (response) {
                var size = response.result
                vm.songListSize = size
            }).catch(function (err) {
                console.log('fetchSongListSize error: ' + err.toLocaleString())
            })
        },
        fetchSongList: function () {
            var from = this.newAccount()
            var to = this.contractAddress
            var value = '0'
            var nonce = '0'
            var gas_price = '1000000'
            var gas_limit = '2000000'
            var contract = {
                "function": 'songListAll',
                "args": '[]'
            }

            var vm = this
            this.neb.api.call(from, to, value, nonce, gas_price, gas_limit, contract).then(function (response) {
                console.log(response)
                var list = JSON.parse(response.result)
                vm.songList = list

                vm.lyrics = []
                for (var item of list) {
                    for (var lyricsID of item.value.lyricsIDs) {
                        vm.fetcLyrics(lyricsID)
                    }
                }

            }).catch(function (err) {
                console.log('fetchSongListSize error: ' + err.toLocaleString())
            })
        },
        fetcLyrics: function(lyricsID) {
            var from = this.newAccount()
            var to = this.contractAddress
            var value = '0'
            var nonce = '0'
            var gas_price = '1000000'
            var gas_limit = '2000000'
            var contract = {
                "function": 'lyricsOf',
                "args": '["' + lyricsID + '"]'
            }

            var vm = this
            this.neb.api.call(from, to, value, nonce, gas_price, gas_limit, contract).then(function (response) {
                vm.lyrics.push({lyricsID: response})
                vm.selectLyrics = JSON.parse(response.result)
                console.log(response)

            }).catch(function (err) {
                console.log('fetchSongList error: ' + err.toLocaleString())
            })
        },
        postSong: function () {
            var NebPay = require("nebpay")
            var nebPay = new NebPay()
            var to = this.contractAddress
            var value = '0'
            var callFunction = 'postSong'
            var callArgs = '["' + this.newSongTitle.trim() + '"]'

            nebPay.call(to, value, callFunction, callArgs, {
                listener: this.postSongHandler
            });

            this.newSongTitle = ''
        },
        postSongHandler: function (response) {
            console.log(response)
            this.refresh()
        },
        refresh: function () {
            this.songListSize = -1
            this.songList = []
            this.fetchSongListSize()
            this.fetchSongList()
            console.log('refreshed')
        },
        setSongForAppendLyrics: function (song) {
            this.songForAppendLyrics = song
            this.lyricsToAppend = ''
        },
        appendLyrics: function () {
            var NebPay = require("nebpay")
            var nebPay = new NebPay()
            var to = this.contractAddress
            var value = '0'
            var callFunction = 'appendLyrics'
            var args = [this.songForAppendLyrics.value.id, this.lyricsToAppend.trim()]
            var callArgs = JSON.stringify(args)

            nebPay.call(to, value, callFunction, callArgs, {
                listener: this.appendLyricsHandler
            });

            this.newSongTitle = ''
        },
        appendLyricsHandler: function (response) {
            console.log(response)
            this.refresh()
        },
        setSelectSong: function (song) {
            this.selectSong = song
            this.setSelectLyricsIndex(0)
            console.log(song)
        },
        isSelectLyricsIndexActive: function (index) {
            return this.selectLyricsIndex === index
        },
        setSelectLyricsIndex: function (index) {
            this.selectLyricsIndex = index
            this.selectLyrics = '加载中……'
            this.fetcLyrics(this.selectSong.value.lyricsIDs[index])
        }
    }
})