import * as React from "react"

export default function Home() {
  return (
    <div className="min-h-screen bg-usa-white">
      <header className="bg-usa-blue text-usa-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold">Goaltending Development Plan Generator</h1>
          <p className="text-xl mt-2">Youth Ice Hockey Goaltending Development</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="bg-usa-red text-usa-white p-8 rounded-lg shadow-lg mb-8">
          <h2 className="text-3xl font-bold mb-4">Welcome</h2>
          <p className="text-lg">
            This website makes it easy for youth ice hockey teams and clubs to generate 
            customized goaltending development plans.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-usa-blue p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-usa-blue mb-3">Customized Plans</h3>
            <p className="text-gray-700">
              Generate development plans tailored to your goaltenders' skill levels and goals.
            </p>
          </div>
          
          <div className="border-2 border-usa-red p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-usa-red mb-3">Easy to Use</h3>
            <p className="text-gray-700">
              Simple interface designed for coaches, parents, and players.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="bg-usa-blue text-usa-white py-4 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2024 Goaltending Development Plan Generator</p>
        </div>
      </footer>
    </div>
  )
}