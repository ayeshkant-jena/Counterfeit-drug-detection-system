// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    struct Batch {
        string medicineName;
        uint bigBoxCount;
        uint smallBoxPerBigBox;
        uint stripsPerSmallBox;
        address createdBy;
        bool shipped;
        bool received;
    }

    mapping(string => Batch) public batches;

    event BatchCreated(string batchId, address createdBy);
    event BatchShipped(string batchId);
    event BatchReceived(string batchId);

    function createBatch(
        string memory batchId,
        string memory medicineName,
        uint bigBoxCount,
        uint smallBoxPerBigBox,
        uint stripsPerSmallBox
    ) public {
        batches[batchId] = Batch(
            medicineName,
            bigBoxCount,
            smallBoxPerBigBox,
            stripsPerSmallBox,
            msg.sender,
            false,
            false
        );
        emit BatchCreated(batchId, msg.sender);
    }

    function markAsShipped(string memory batchId) public {
        require(!batches[batchId].shipped, "Already shipped");
        batches[batchId].shipped = true;
        emit BatchShipped(batchId);
    }

    function markAsReceived(string memory batchId) public {
        require(batches[batchId].shipped, "Not yet shipped");
        require(!batches[batchId].received, "Already received");
        batches[batchId].received = true;
        emit BatchReceived(batchId);
    }

    function getBatch(string memory batchId) public view returns (
        string memory, uint, uint, uint, address, bool, bool
    ) {
        Batch memory b = batches[batchId];
        return (
            b.medicineName,
            b.bigBoxCount,
            b.smallBoxPerBigBox,
            b.stripsPerSmallBox,
            b.createdBy,
            b.shipped,
            b.received
        );
    }
}
