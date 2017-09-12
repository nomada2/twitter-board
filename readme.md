Playground for Node, Angular, WebSockets, Azure IoT, Azure Stream Analytics, Azure Machine Learning, Twitter API, Sentiment140

Backend will accept websocket connections, and start streaming tweets matching search terms sent by the client (including also a sentiment score for each tweet from Sentiment140).
In parallel, tweets will also be sent to an Azure IoT hub, processed live with Stream Analytics and Machine Learning, and stored in Azure Table Storage.