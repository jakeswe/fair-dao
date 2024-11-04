// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "hardhat/console.sol";

contract Node {
    FairDao public _dao;
    Node public _parent;
    uint256 _total_added = 0;
    address payable public _owner;
    uint256 public _contribution;
    Node[] public _children;
    event Response(bool success, bytes data);
    event Received(address sender, uint value);
    event GetChildContributionsEvent(uint256 contributions);
    event GetMaxEvent(uint256 max);
    event GetMinEvent(uint256 min);
    event NodePayedEvent(address node, uint256 payment, uint256 gas);

    function sendPayment() public payable {
        _contribution += msg.value;
        if (address(_parent) != address(0) && this.getContribution() > _parent.getContribution()){
            Node grandParent = _parent.getParent();
            _dao.promoteChild(grandParent, _parent);
        }
        (bool success, bytes memory data) = address(_dao).call{
            value: msg.value,
            gas: gasleft()
        }(abi.encodeWithSignature("receivePayment(address)", address(this)));

        emit Response(success, data);
        require(success, "Failed to send Ether");
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    fallback() external payable { 
        return;
    }

    modifier onlyDao {
        require(msg.sender == address(_dao), "Dao only function");
        _;
    }

    function receiveComission() public payable {
        (bool sent, ) = _owner.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
    }

    function receivePayment(address payable caller) public payable returns (uint256) {
        if (gasleft() < 2300) {
            (bool remainderSent, ) = Node(caller).getOwner().call{value: msg.value}("");
            require(remainderSent, "Failed to send Ether");
            return 0;
        }
        if (msg.value < 2300) {
            (bool remainderSent, ) = _owner.call{value: msg.value}("");
            require(remainderSent, "Failed to send Ether");
            return 0;
        }
        uint256 payment = msg.value / 5;
        (bool sent, ) = _owner.call{value: payment}("");
        require(sent, "Failed to send Ether");
        emit NodePayedEvent(address(this), payment, gasleft());
        uint256 used_value = payment;
        uint256 total = getChildContributions();
        if (_children.length > 0 && total > 0){
            for (uint256 y = 0; y < _children.length; y++){
                uint256 contribution = _children[y].getContribution();
                payment = msg.value * contribution / total * 4 / 5;
                (bool success, bytes memory data_child) = address(_children[y]).call{
                    value: payment,
                    gas: gasleft()
                }(abi.encodeWithSignature("receivePayment(address)", caller));
                require(success, "Failed to send Ether");
                (uint256 used_value_child) = abi.decode(data_child, (uint256));
                used_value += used_value_child;
            }
        } else {
            uint256 comission = msg.value - used_value;
            (bool comissionSent, ) = caller.call{
                value: comission,
                gas: gasleft()}(abi.encodeWithSignature("receiveComission()"));
            require(comissionSent, "Failed to send Ether");
        }
        return used_value;
    }

    function getChildContributions() public returns (uint256) {
        uint256 total = 0;
        for (uint256 y = 0; y < _children.length; y++){
            total += _children[y].getContribution();
        }
        emit GetChildContributionsEvent(total);
        return total;
    }


    function getContribution() public view returns (uint256) {
        return _contribution;
    }

    function incTotalAdded() public onlyDao {
        _total_added += 1;
    }

    function getTotalAdded() public view returns (uint256) {
        return _total_added;
    }

    function getOwner() public view returns (address payable) {
        return _owner;
    }

    function setOwner(address payable owner) public onlyDao {
        _owner = owner;
    }

    function setContribution(uint256 contribution) public onlyDao {
        _contribution = contribution;
    }

    function getLength() public view returns (uint256) {
        return _children.length;
    }

    function getChild(uint256 i) public view returns (Node) {
        return _children[i];
    }

    function getChildIndex(Node child) public view returns(uint256){
        for (uint256 y = 0; y < _children.length; y++) {
            if (child == _children[y]) {
                return y;
            }
        }
        return 0;
    }

    function setChild(uint256 i, Node child) public onlyDao {
        _children[i] = child;
    }

    function deleteChild(uint256 i) public onlyDao {
        delete _children[i];
        if (i < _children.length - 1) {
            _children[i] = _children[_children.length - 1];
        }
        _children.pop();
    }

    function pushChild(Node child) public onlyDao {
        _children.push(child);
    }

    function getParent() public view returns (Node) {
        return _parent;
    }

    function setParent(Node parent) public onlyDao {
        _parent = parent;
    }

    function getMax() public returns (uint256) {
        uint256 max = 0;
        uint256 index = 0;
        for (uint256 y = 0; y < this.getLength(); y++){
            Node child = this.getChild(y);
            if (child.getContribution() > max){
                max = child.getContribution();
                index = y;
            }
        }
        emit GetMaxEvent(index);
        return index;
    }

    function getMin() public returns (uint256) {
            uint256 min = type(uint256).max;
            uint256 index = 0;
            for (uint256 y = 0; y < _children.length; y++) {
                Node child = _children[y];
                if (child.getContribution() < min) {
                    min = child.getContribution();
                    index = y;
                }
            }
            emit GetMinEvent(index);
            return index;
        }

    constructor(FairDao dao, address payable owner, uint256 contribution){
        _dao = dao;
        _owner = owner;
        _contribution = contribution;
    }
}

contract FairDao {
    uint256 _order = 3;
    // 100 USD
    uint256 _hireCost = 5073566;
    Node _root;
    mapping (address => Node) nodeMap;
    event Received(address sender, uint value);
    event ChildAddedEvent(bool added, Node child);

    constructor (uint256 hireCost, uint order){
        _hireCost = hireCost;
        _order = order;
        _root = new Node(this, payable(msg.sender), 0);
        nodeMap[msg.sender] = _root;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    fallback() external payable { 
    }

    modifier onlyNodeOwner(address payable nodeAddress){
        require(Node(nodeAddress).getOwner() == msg.sender, "Only Node Owner");
        _;
    }

    modifier onlyChildGrandChild(Node grandParent, Node parent){
        Node child = Node(payable(msg.sender));
        require(address(getNode(child.getOwner())) != address(0), "Caller Must Be A Child Node");
        require(child.getParent() == parent, "Parent must be child's parent");
        require(parent.getParent() == grandParent, "Grandparent must be child's grandparent");
        _;
    }

    function getNode(address owner)  public view returns (Node) {
        return nodeMap[owner];
    }

    function getRoot() public view returns (Node) {
        return _root;
    }

    function receivePayment(address payable caller) payable public {
        (bool success, ) = address(_root).call{
            value: msg.value,
            gas: gasleft()
        }(abi.encodeWithSignature("receivePayment(address)", caller));
        require(success, "Failed to send Ether");
    }

    function insert(address payable parent_address, address payable owner) public onlyNodeOwner(parent_address) {
        Node parent = Node(parent_address);
        Node node = new Node(this, owner, 0);
        if (parent.getContribution() / _hireCost - parent.getTotalAdded() < 1) {
            emit ChildAddedEvent(false, node);
            return;
        }
        if (parent.getLength() >= _order) {
            parent.deleteChild(parent.getMin());
        }
        nodeMap[owner] = node;
        parent.pushChild(node);
        parent.incTotalAdded();
        node.setParent(parent);
        emit ChildAddedEvent(true, node);
    }

    function promoteChild(Node x, Node y) public onlyChildGrandChild(x, y) {
        if (y == _root) {
            Node root = _root;
            address payable nextRootAddress = root.getChild(root.getMax()).getContribution() > root.getContribution() ? root.getChild(root.getMax()).getOwner() : root.getOwner();
            uint256 nextRootContribution = root.getChild(root.getMax()).getContribution() > root.getContribution() ? root.getChild(root.getMax()).getContribution() : root.getContribution();
            _root = new Node(this, nextRootAddress, nextRootContribution);
            _root.pushChild(root);
            root.setParent(_root);
            x = _root;
        }
        Node promoted = y.getChild(y.getMax());
        y.deleteChild(y.getChildIndex(promoted));
        x.pushChild(promoted);
        promoted.setParent(x);
        if (x.getLength() >= _order) {
            x.deleteChild(x.getMin());
        }
        if (x.getChild(x.getMax()).getContribution() > x.getContribution()){
            Node parent = x.getParent();
            promoteChild(parent, x);
        }
    }
}